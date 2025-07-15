import { INewsLetterService } from "../../../domain/interfaces/INewsletterService";
import dotenv from "dotenv";

dotenv.config();

interface KlaviyoProfileData {
  id: string;
}

interface KlaviyoListResponse {
  data: KlaviyoProfileData[];
}

export class KlaviyoNewsletterService implements INewsLetterService {
  private readonly baseUrl  = process.env.KLAVIYO_API_BASE ?? "https://a.klaviyo.com/api";
  private readonly apiKey   = process.env.KLAVIYO_API_KEY!;      // private key, must be set
  private readonly listId   = process.env.KLAVIYO_LIST_ID!;     // list ID, must be set
  private readonly revision = "2025-04-15";

  /** Common JSON:API headers including authorization */
  private get headers() {

    if(!this.apiKey || !this.listId) {
        throw new Error("Klaviyo API Key and List ID must be set in environment variables");
    }

    return {
      "Content-Type":  "application/vnd.api+json",
      "Accept":        "application/vnd.api+json",
      "Authorization": `Klaviyo-API-Key ${this.apiKey}`,
      "Revision":      this.revision,
    };
  }

  /** Helper to perform fetch and throw detailed errors */
  private async request<T>(url: string, init: RequestInit): Promise<T> {
    const res = await fetch(url, init);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Klaviyo ${init.method ?? "GET"} ${url} failed (${res.status}): ` +
        `${res.statusText} ${text}`
      );
    }
    return res.status === 204 ? ({} as T) : (await res.json() as T);
  }

  /** 1. Try to find an existing profile by email */
  private async getProfileId(email: string): Promise<string> {
    console.log(this.headers)
    const url = new URL(`${this.baseUrl}/profiles`);
    url.searchParams.set("filter[email]", `equals(email,"${email}")`);

    const resp = await this.request<KlaviyoListResponse>(url.toString(), {
    
      method: "GET",
      headers: this.headers,
    });

    if (!resp.data.length) {
      throw new Error(`Profile not found for ${email}`);
    }
    return resp.data[0].id;
  }

  /** 2. Create a new profile with optional custom properties */
  private async createProfile(
    email: string,
    name: string,
    properties?: Record<string, any>
  ): Promise<string> {
    const [first_name, last_name = ""] = name.split(" ", 2);
    const data: any = {
      type: "profile",
      attributes: { email, first_name, last_name }
    };
    if (properties) data.properties = properties;

    const payload = { data };
    const json = await this.request<{ data: KlaviyoProfileData }>(
      `${this.baseUrl}/profiles`,
      {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(payload),
      }
    );
    return json.data.id;
  }

  /** 3. Upsert logic: try GET, otherwise CREATE */
  private async upsertProfile(
    email: string,
    name: string,
    properties?: Record<string, any>
  ): Promise<string> {
    try {
      return await this.getProfileId(email);
    } catch {
      return await this.createProfile(email, name, properties);
    }
  }

  /** Public: upsert profile and add to list */
  async subscribeUser(
    email: string,
    name: string,
    termsAgreed: boolean,
    requestUpdate: boolean
  ): Promise<void> {
    if (!email || !name) {
      throw new Error("Email and name are required to subscribe");
    }
  
    // 1) Upsert the profile (create or fetch its ID)
    const profileId = await this.upsertProfile(email, name, { termsAgreed, requestUpdate });
  
    // 2) Point at the relationships endpoint
    const url = `${this.baseUrl}/lists/${this.listId}/relationships/profiles`;
  
    // 3) POST a profile relationship
    await this.request<void>(url, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        data: [{ type: "profile", id: profileId }]
      }),
    });
  }

  /** Public: remove profile from list */
  async unsubscribeUser(email: string): Promise<void> {
    if (!email) {
      throw new Error("Email is required to unsubscribe");
    }
    const profileId = await this.getProfileId(email);
    const url = `${this.baseUrl}/lists/${this.listId}/relationships/profiles`;
    await this.request<void>(url, {
      method: "DELETE",
      headers: this.headers,
      body: JSON.stringify({ data: [{ type: "profile", id: profileId }] }),
    });
  }
}
