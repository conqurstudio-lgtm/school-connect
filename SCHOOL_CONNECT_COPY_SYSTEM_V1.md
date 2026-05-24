# School Connect Copy System v1

## Purpose

This guide defines how School Connect speaks across sign in, school, teacher, parent, messages, reports, notifications and empty states. It is based on a minimalist product-copy approach: clear labels, short states, direct actions and no over-explaining.

## Copy personality

School Connect should sound calm, practical and trusted. The copy should feel like a helpful school office assistant, not a sales page and not a dashboard manual.

## Core rules

1. Use short labels.
2. Use verbs for actions.
3. Use one sentence for helper text.
4. Avoid explaining the next step unless the user may be confused.
5. Avoid repeating the product vision on every screen.
6. Use the same words for the same action everywhere.
7. Empty states should say what is missing and what to do next.
8. Toasts should confirm what happened, not explain the whole process.

## Preferred words

| Concept | Use | Avoid |
|---|---|---|
| Main parent area | School Life | Feed |
| Parent joins class | Claim child | Request access |
| Teacher class updates | Class Life | Posts dashboard |
| Child reports | Child reports | Progress management |
| Private thread | Message | Conversation module |
| School account | Create school account | Register new organization |
| Parent account from link | Create parent account | Parent onboarding registration |
| Teacher class link | Share class link | Generate access URL |
| Parent link status | Linked / Not linked | Approved / Pending unless approval is actually used |

## Text entry labels

Use clear labels with examples inside fields.

| Field | Label | Placeholder |
|---|---|---|
| Login email | Email | name@example.com |
| Login password | Password | Enter password |
| School signup name | Full name | School owner name |
| School email | Email | school@example.com |
| Parent name | Full name | Parent name |
| Parent phone | Phone | 071 234 5678 |
| Child name | Child name | Child full name |

## Button copy

Use short action-first labels.

| Situation | Button |
|---|---|
| Sign in | Sign in |
| School signup | Create school account |
| Parent invite signup | Create parent account |
| Class link | Share class link |
| Parent joins class | Claim child |
| Add child | Add child |
| Add teacher | Add teacher |
| Send message | Send |
| Create report | Add report |
| Save settings | Save |
| Cancel | Cancel |

## Empty states

Pattern:

`Short heading`  
`One short sentence.`  
`One action button if needed.`

Examples:

- Nothing shared yet — Class Life will appear here.
- No children yet — Add children before sharing the class link.
- No reports yet — Child reports will appear here.
- No messages yet — Start with a short message.
- No teachers yet — Add your first teacher.

## Toasts

Toasts should be short and specific.

| Event | Toast |
|---|---|
| Saved | Saved |
| Message sent | Message sent |
| Child linked | Child linked |
| Link copied | Link copied |
| Report added | Report added |
| Upload complete | Uploaded |
| Generic failure | Something went wrong |
| Child not found | Child not found in this class |

## Notifications

Notifications should be action-based and human.

| Event | Notification title | Supporting text |
|---|---|---|
| New class post | New class update | A teacher shared something in Class Life. |
| New report | New child report | A new report is ready. |
| New message | New message | You have a new message. |
| Parent claimed child | Child claimed | A parent linked to a child. |
| Reaction | New reaction | A parent reacted to a class post. |

## Page copy direction

### Sign in

Use:
- School Connect
- Sign in to your space.
- Email
- Password
- Sign in
- Create school account

### School

Use simple account and structure language:
- School Life
- Profile
- Classes
- Settings
- Add teacher
- Add class

### Teacher

Use class ownership language:
- Class Life
- Children
- Messages
- Reports
- Share class link
- Add child

### Parent

Use parent outcome language:
- School Life
- Messages
- Child reports
- Claim child

## Writing style checklist

- Is the sentence shorter than 12 words?
- Does the button start with an action?
- Is the same feature named the same way elsewhere?
- Did we remove any unnecessary explanation?
- Does the empty state tell the user what happens next?
- Does this copy still make sense on a small phone screen?

## What not to do

- Do not call parent School Life a feed.
- Do not use dashboard language for parents.
- Do not use approval language in instant child-claim flows.
- Do not write long helper paragraphs under every section.
- Do not introduce new labels for existing actions.
