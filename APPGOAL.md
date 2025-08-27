Build me a clean, professional social messaging web app called "OffGrid" using Next.js 14, Tailwind CSS, and shadcn/ui.

⚡ Design:
- Mobile-first design with bottom navigation that also stays visible on Tablet view.
- Theme: Heavy dark black background (#000000), white text (#FFFFFF), and vibrant yellow (#FFD600) as the primary accent.
- Use smooth animations with Framer Motion, and rounded cards for a professional, modern feel.

📱 Screens:
1. Auth:
   - Use Supabase authentication (email + password).
   - Sign up and login forms with fields: Full Name, Email, Password.
   - On sign up, save user full name as display name in Supabase.
2. Friends:
   - Fetch list of registered users from Supabase.
   - Each user card has avatar placeholder, name, bio, and Follow button.
   - Follow requests can be approved or rejected (store status in Supabase).
3. Messages:
   - Chat list with last message preview and online status indicator.
   - Chat UI with message bubbles:
     - My messages: yellow bubble with black text.
     - Friend’s messages: dark gray bubble with white text.
   - Support sending text + file attachments (image/pdf/txt) stored in **Supabase Storage** with metadata in database.
4. Settings:
   - Profile page where user can upload an avatar (Supabase Storage), edit bio, and update display name.

⚙️ Backend:
- Use Supabase database (PostgreSQL) for all app data.
- Use Prisma ORM for schema and migrations against Supabase Postgres.
- Core models: User, Follow, Message, Attachment.
- Integrate with Supabase Auth and Supabase Storage for files.
- CRUD API routes for Friends, Follow, Messages, Profile.
- Real-time chat updates using Supabase Realtime subscriptions.

Deploy the app with integration-ready code for Vercel, with environment variables configured for Supabase URL and API Key.
