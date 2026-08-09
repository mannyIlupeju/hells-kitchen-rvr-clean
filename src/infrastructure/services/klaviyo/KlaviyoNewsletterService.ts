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
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      throw new Error(
        `Klaviyo ${init.method ?? "GET"} ${url} failed (${res.status}): ` +
        `${res.statusText} ${text}`
      );
    }
    // Job-queuing endpoints (e.g. profile-subscription-bulk-create-jobs) return 202 with no body
    return text ? (JSON.parse(text) as T) : ({} as T);
  }

  /** 1. Try to find an existing profile by email */
  private async getProfileId(email: string): Promise<string> {
    const url = new URL(`${this.baseUrl}/profiles`);
    url.searchParams.set("filter", `equals(email,"${email}")`);

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
    properties?: Record<string, any>,
    phone?: string
  ): Promise<string> {
    const [first_name, last_name = ""] = name.split(" ", 2);
    const attributes: any = { email, first_name, last_name };
    if (phone) attributes.phone_number = phone;
    const data: any = {
      type: "profile",
      attributes
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

  /** Update phone number on an existing profile */
  private async updateProfilePhone(profileId: string, phone: string): Promise<void> {
    await this.request<void>(`${this.baseUrl}/profiles/${profileId}`, {
      method: "PATCH",
      headers: this.headers,
      body: JSON.stringify({
        data: {
          type: "profile",
          id: profileId,
          attributes: { phone_number: phone },
        },
      }),
    });
  }

  /**
   * 3. Upsert logic: try GET, otherwise CREATE. Keeps phone number in sync either way.
   * Klaviyo rejects phone_number values it can't validate as SMS-deliverable (e.g. fake
   * or malformed numbers) — that must not block the email profile from being found/created
   * and added to the list, so phone failures are caught and logged rather than propagated.
   */
  private async upsertProfile(
    email: string,
    name: string,
    properties?: Record<string, any>,
    phone?: string
  ): Promise<string> {
    try {
      const profileId = await this.getProfileId(email);
      if (phone) {
        try {
          await this.updateProfilePhone(profileId, phone);
        } catch (err) {
          console.error(`Klaviyo rejected phone number for ${email}, profile kept without it:`, err);
        }
      }
      return profileId;
    } catch {
      try {
        return await this.createProfile(email, name, properties, phone);
      } catch (err) {
        if (!phone) throw err;
        console.error(`Klaviyo rejected phone number for ${email} on create, retrying without it:`, err);
        return await this.createProfile(email, name, properties);
      }
    }
  }

  /**
   * Sets actual SMS marketing consent on the list via Klaviyo's bulk subscription
   * job. Unlike setting `phone_number` as a plain attribute, this is what makes a
   * profile legally subscribed to SMS and eligible to receive SMS campaigns for
   * this list. Requires a phone number Klaviyo can validate as SMS-deliverable.
   */
  private async subscribeSms(email: string, phone: string): Promise<void> {
    await this.request<void>(`${this.baseUrl}/profile-subscription-bulk-create-jobs`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        data: {
          type: "profile-subscription-bulk-create-job",
          attributes: {
            profiles: {
              data: [
                {
                  type: "profile",
                  attributes: {
                    email,
                    phone_number: phone,
                    subscriptions: {
                      sms: { marketing: { consent: "SUBSCRIBED" } },
                    },
                  },
                },
              ],
            },
            historical_import: false,
          },
          relationships: {
            list: { data: { type: "list", id: this.listId } },
          },
        },
      }),
    });
  }

  /**
   * Public: upsert profile, store phone number (if provided) as a plain profile
   * attribute, and add to the newsletter list.
   *
   * `smsConsent` controls whether we also set actual SMS marketing consent via
   * Klaviyo's subscription API (requires a TCPA-compliant opt-in checkbox on the
   * frontend and a validatable phone number) — without it, the phone number is
   * captured as data only and the profile is not SMS-subscribed.
   */
  async subscribeUser(
    email: string,
    name: string,
    termsAgreed: boolean,
    requestUpdate: boolean,
    phone?: string,
    smsConsent?: boolean
  ): Promise<void> {
    if (!email || !name) {
      throw new Error("Email and name are required to subscribe");
    }

    // 1) Upsert the profile (create or fetch its ID), syncing phone number
    const profileId = await this.upsertProfile(email, name, { termsAgreed, requestUpdate }, phone);

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

    // 4) If the user opted into SMS, set actual marketing consent. A phone
    // Klaviyo can't validate must not fail the whole subscribe attempt — the
    // email subscription above has already succeeded at this point.
    if (smsConsent && phone) {
      try {
        await this.subscribeSms(email, phone);
      } catch (err) {
        console.error(`Klaviyo SMS consent failed for ${email}:`, err);
      }
    }
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
