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
  private readonly revision = "2026-07-15";

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
   * Sets actual EMAIL marketing consent (and list membership) via Klaviyo's bulk
   * subscription job. Adding a profile to a list via the plain relationships
   * endpoint does NOT grant marketing consent per Klaviyo's docs — campaigns sent
   * to the list will silently skip non-consented profiles. This is deliberately
   * the only step that must succeed for a signup to "count": no phone_number is
   * included here so a Klaviyo-rejected phone number can never block email
   * consent (phone and name are captured separately, best-effort, in
   * upsertProfile — this endpoint's profile object rejects first_name/last_name).
   */
  private async subscribeEmail(email: string): Promise<void> {
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
                    subscriptions: {
                      email: { marketing: { consent: "SUBSCRIBED" } },
                    },
                  },
                },
              ],
            },
            historical_import: false,
            custom_source: "Website Newsletter Signup",
          },
          relationships: {
            list: { data: { type: "list", id: this.listId } },
          },
        },
      }),
    });
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
            custom_source: "Website Newsletter Signup",
          },
          relationships: {
            list: { data: { type: "list", id: this.listId } },
          },
        },
      }),
    });
  }

  /**
   * Public: grant real email marketing consent (and list membership) — the step
   * that actually matters for being able to send campaigns to this person later.
   * Phone number is captured separately as a best-effort, non-blocking step, and
   * SMS consent is set only if explicitly opted in. Order matters: email consent
   * runs first and its success is independent of anything phone-related.
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

    // 1) Grant actual email marketing consent + list membership. This must
    // succeed for the signup to count, so no phone_number is included here —
    // a Klaviyo-rejected phone must never be able to block email consent.
    await this.subscribeEmail(email);

    // 2) Best-effort: set name and (if provided) phone number as plain profile
    // attributes — data capture only, no consent implied. Runs regardless of
    // whether a phone was given, since it's also what sets first/last name.
    // Must not fail the overall subscribe.
    try {
      await this.upsertProfile(email, name, { termsAgreed, requestUpdate }, phone);
    } catch (err) {
      console.error(`Failed to sync profile details for ${email}:`, err);
    }

    // 3) If the user opted into SMS, set actual SMS marketing consent. A phone
    // Klaviyo can't validate must not fail the whole subscribe attempt — email
    // consent above has already succeeded at this point.
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
