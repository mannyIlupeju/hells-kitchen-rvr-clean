"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KlaviyoNewsletterService = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class KlaviyoNewsletterService {
    constructor() {
        var _a;
        this.baseUrl = (_a = process.env.KLAVIYO_API_BASE) !== null && _a !== void 0 ? _a : "https://a.klaviyo.com/api";
        this.apiKey = process.env.KLAVIYO_API_KEY; // private key, must be set
        this.listId = process.env.KLAVIYO_LIST_ID; // list ID, must be set
        this.revision = "2025-04-15";
    }
    /** Common JSON:API headers including authorization */
    get headers() {
        if (!this.apiKey || !this.listId) {
            throw new Error("Klaviyo API Key and List ID must be set in environment variables");
        }
        return {
            "Content-Type": "application/vnd.api+json",
            "Accept": "application/vnd.api+json",
            "Authorization": `Klaviyo-API-Key ${this.apiKey}`,
            "Revision": this.revision,
        };
    }
    /** Helper to perform fetch and throw detailed errors */
    request(url, init) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const res = yield fetch(url, init);
            if (!res.ok) {
                const text = yield res.text().catch(() => "");
                throw new Error(`Klaviyo ${(_a = init.method) !== null && _a !== void 0 ? _a : "GET"} ${url} failed (${res.status}): ` +
                    `${res.statusText} ${text}`);
            }
            return res.status === 204 ? {} : yield res.json();
        });
    }
    /** 1. Try to find an existing profile by email */
    getProfileId(email) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(this.headers);
            const url = new URL(`${this.baseUrl}/profiles`);
            url.searchParams.set("filter[email]", `equals(email,"${email}")`);
            const resp = yield this.request(url.toString(), {
                method: "GET",
                headers: this.headers,
            });
            if (!resp.data.length) {
                throw new Error(`Profile not found for ${email}`);
            }
            return resp.data[0].id;
        });
    }
    /** 2. Create a new profile with optional custom properties */
    createProfile(email, name, properties) {
        return __awaiter(this, void 0, void 0, function* () {
            const [first_name, last_name = ""] = name.split(" ", 2);
            const data = {
                type: "profile",
                attributes: { email, first_name, last_name }
            };
            if (properties)
                data.properties = properties;
            const payload = { data };
            const json = yield this.request(`${this.baseUrl}/profiles`, {
                method: "POST",
                headers: this.headers,
                body: JSON.stringify(payload),
            });
            return json.data.id;
        });
    }
    /** 3. Upsert logic: try GET, otherwise CREATE */
    upsertProfile(email, name, properties) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.getProfileId(email);
            }
            catch (_a) {
                return yield this.createProfile(email, name, properties);
            }
        });
    }
    /** Public: upsert profile and add to list */
    subscribeUser(email, name, termsAgreed, requestUpdate) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!email || !name) {
                throw new Error("Email and name are required to subscribe");
            }
            // 1) Upsert the profile (create or fetch its ID)
            const profileId = yield this.upsertProfile(email, name, { termsAgreed, requestUpdate });
            // 2) Point at the relationships endpoint
            const url = `${this.baseUrl}/lists/${this.listId}/relationships/profiles`;
            // 3) POST a profile relationship
            yield this.request(url, {
                method: "POST",
                headers: this.headers,
                body: JSON.stringify({
                    data: [{ type: "profile", id: profileId }]
                }),
            });
        });
    }
    /** Public: remove profile from list */
    unsubscribeUser(email) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!email) {
                throw new Error("Email is required to unsubscribe");
            }
            const profileId = yield this.getProfileId(email);
            const url = `${this.baseUrl}/lists/${this.listId}/relationships/profiles`;
            yield this.request(url, {
                method: "DELETE",
                headers: this.headers,
                body: JSON.stringify({ data: [{ type: "profile", id: profileId }] }),
            });
        });
    }
}
exports.KlaviyoNewsletterService = KlaviyoNewsletterService;
