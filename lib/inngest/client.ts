import { Inngest} from "inngest";

export const inngest = new Inngest({
    id: 'signalist',
    // Required for server-side event sending to Inngest Cloud
    eventKey: process.env.INNGEST_EVENT_KEY!,
    ai: { gemini: { apiKey: process.env.GEMINI_API_KEY! }}
})
