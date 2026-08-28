import { Link } from 'react-router-dom';
import LegalLayout from '../components/LegalLayout.jsx';

export default function Privacy() {
  return (
    <LegalLayout
      tag="Legal"
      tagIcon="fa-solid fa-user-shield"
      title="Privacy"
      highlight="Policy"
      sub="What we collect, why we collect it, and how it's protected."
      seoTitle="Privacy Policy"
      seoDescription="How SastiTripsWale collects, uses, stores, and protects your personal information, including payment, identity-verification, and profile data."
      path="/privacy"
      updated="26 August 2026"
    >
      <h2>1. Who this policy covers</h2>
      <p>
        This Privacy Policy explains how SastiTripsWale, operated by Sahil Kashyap (Sector 119, Mohali, Punjab
        160055), collects, uses, stores, and shares personal information when you use our website and services
        (the "Platform"). By using the Platform, you agree to the collection and use of information as described
        here.
      </p>

      <h2>2. Information we collect</h2>
      <h3>Account &amp; profile information</h3>
      <ul>
        <li>Full name, username, email address, mobile number, and password (stored as a salted hash, never in plain text).</li>
        <li>Gender, age, city, state, profession, a short bio, and your travel-companion preference (who you'd like to travel with - a safety/comfort setting, not a matching algorithm).</li>
        <li>Optional: profile photo, cover photo, social media handles, relationship status (used only to offer Couples Mode trip seating), and an emergency contact.</li>
        <li>Vehicle details if you register as a vehicle owner (type, brand, model, registration number, mileage).</li>
        <li>Travel interests and lifestyle preferences you choose to add to your profile.</li>
      </ul>
      <h3>Identity verification documents</h3>
      <p>
        To verify member identity for community safety, we collect a government ID (Aadhaar, and optionally PAN,
        Voter ID, or Driving Licence), a live selfie, and - for vehicle owners - a vehicle registration
        certificate (RC) and driving licence. These are stored securely, reviewed by our admin team, and are
        never shown publicly on your profile or shared with other members.
      </p>
      <h3>Trip &amp; community activity</h3>
      <p>
        Trips you host or join, expense estimates you enter, club memberships, gallery photos you upload,
        reviews you post, connection requests, and messages you send in trip/club/direct chats.
      </p>
      <h3>Payment information</h3>
      <p>
        When you pay your membership fee, payment is processed by <strong>Razorpay</strong>. We receive and
        store only the transaction result - order ID, payment ID, amount, currency, status, and the plan you
        purchased. <strong>We never receive or store your card number, UPI PIN, or net-banking credentials</strong> -
        those are entered directly on Razorpay's secure checkout. If you become eligible for a wallet payout
        (referral or influencer rewards), we collect the bank/UPI details you provide for that payout.
      </p>
      <h3>Technical information</h3>
      <p>
        We use <code>localStorage</code> in your browser to keep you logged in (an encrypted session token) and
        remember your display theme. We do not currently use third-party advertising or analytics tracking
        cookies. Our server logs standard request information (such as IP address and timestamps) for security
        and abuse prevention.
      </p>

      <h2>3. Why we collect it</h2>
      <ul>
        <li>To create and operate your account and let you use trip, club, and chat features.</li>
        <li>To verify member identity and keep the community safe.</li>
        <li>To process your membership payment and maintain a record of it.</li>
        <li>To send you transactional emails (welcome, payment receipt, password reset, trip/connection notifications).</li>
        <li>To respond to support requests and enforce our Terms &amp; Conditions.</li>
        <li>To calculate and pay out referral/influencer rewards, where applicable.</li>
      </ul>

      <h2>4. Who we share it with</h2>
      <ul>
        <li><strong>Razorpay</strong> - to process your membership payment. Razorpay's own privacy policy governs the data it collects directly from you at checkout.</li>
        <li><strong>Hosting &amp; infrastructure providers</strong> (our application-hosting and database providers) - to run the Platform. They do not use your data for their own purposes.</li>
        <li><strong>Email delivery provider</strong> - to send transactional emails.</li>
        <li><strong>Other members</strong> - only the information in your public profile (name, username, city, bio, travel interests, verification badge). Your email, mobile number, and ID documents are never shown to other members.</li>
        <li><strong>Law enforcement or regulators</strong> - only where required by applicable law.</li>
      </ul>
      <p>We do not sell your personal information to anyone.</p>

      <h2>5. How we protect it</h2>
      <ul>
        <li>Passwords are hashed with bcrypt and never stored or transmitted in plain text.</li>
        <li>Sessions use short-lived access tokens plus rotating refresh tokens; a compromised refresh token is automatically revoked on reuse.</li>
        <li>Payment signatures from Razorpay are cryptographically verified server-side before any membership is activated.</li>
        <li>Identity documents and ID/emergency-contact fields are restricted to you and admin reviewers, and excluded from any data returned to other members or the public API.</li>
        <li>Admin access to sensitive user data is role-restricted and logged.</li>
      </ul>

      <h2>6. Your rights &amp; choices</h2>
      <ul>
        <li>You can view and update most of your profile information at any time from your account's Edit Profile page.</li>
        <li>You can block another member (which also stops their connection requests and messages to you) or report a profile from that member's page.</li>
        <li>
          To request a copy of your data, a correction, or deletion of your account, contact us at{' '}
          <a href="mailto:support@sastitripswale.com">support@sastitripswale.com</a>. We will verify your
          identity and act on the request, subject to any records we're legally required to retain (for example,
          payment records for tax/accounting purposes).
        </li>
      </ul>

      <h2>7. Data retention</h2>
      <p>
        We retain account and activity data for as long as your account is active, and payment records for as
        long as required by applicable accounting and tax law. If you request account deletion, we remove or
        anonymize your profile and identity documents, subject to the retention exception above.
      </p>

      <h2>8. Children's privacy</h2>
      <p>The Platform is intended for users aged 18 and above. We do not knowingly collect data from anyone under 18.</p>

      <h2>9. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time; the "Last updated" date above will change when we
        do. For material changes, we'll take reasonable steps to notify members.
      </p>

      <h2>10. Contact us</h2>
      <p>
        Questions about this policy or your data can be sent to{' '}
        <a href="mailto:support@sastitripswale.com">support@sastitripswale.com</a> or via the{' '}
        <Link to="/contact">Contact page</Link>.
      </p>
    </LegalLayout>
  );
}
