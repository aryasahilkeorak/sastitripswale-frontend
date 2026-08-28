import { Link } from 'react-router-dom';
import LegalLayout from '../components/LegalLayout.jsx';

export default function Terms() {
  return (
    <LegalLayout
      tag="Legal"
      tagIcon="fa-solid fa-scale-balanced"
      title="Terms &"
      highlight="Conditions"
      sub="The rules that govern your use of SastiTripsWale."
      seoTitle="Terms & Conditions"
      seoDescription="Terms and conditions for using SastiTripsWale - membership, trips, payments, refunds, and community rules."
      path="/terms"
      updated="28 August 2026"
    >
      <h2>1. Who we are</h2>
      <p>
        SastiTripsWale ("SastiTripsWale", "we", "us", "our") is a travel-community platform operated as a sole
        proprietorship by <strong>Sahil Kashyap</strong>, based at Sector 119, Mohali, Punjab 160055, India.
        These Terms &amp; Conditions ("Terms") govern your access to and use of the SastiTripsWale website and
        related services (the "Platform"). By creating an account or using the Platform, you agree to these Terms.
        If you do not agree, do not use the Platform.
      </p>

      <h2>2. What SastiTripsWale is</h2>
      <p>
        SastiTripsWale is a travel-focused community platform. It lets members discover trips, host their own
        trips, join trips hosted by other members, create and join travel clubs, browse a member directory, and
        connect and chat with fellow travelers who share similar travel interests.
      </p>
      <p>
        <strong>SastiTripsWale is not a travel agency, tour operator, travel-booking platform, or payment
        aggregator.</strong> We do not sell flights, hotels, buses, or holiday packages, and we do not book or
        arrange travel on your behalf. Trips shown on the Platform are created and organized by members
        themselves. Any per-head budget shown on a trip is an informational estimate entered by the trip's
        organizer, split evenly for display purposes - SastiTripsWale does not collect, hold, or transfer this
        money between members. Any actual cost-sharing between travelers on a trip happens directly between
        those members, outside of SastiTripsWale and outside of any payment processed through this Platform.
      </p>

      <h2>3. Eligibility &amp; your account</h2>
      <ul>
        <li>You must be at least 18 years old to create an account.</li>
        <li>You must provide accurate information at signup and keep your profile information current.</li>
        <li>You are responsible for keeping your password confidential and for all activity under your account.</li>
        <li>One account per person. Accounts are non-transferable.</li>
        <li>
          Certain features (hosting a trip, joining a trip, creating a club, connecting with other members)
          require an active membership <em>and</em> a complete profile, including identity verification
          documents described below.
        </li>
      </ul>

      <h2>4. Identity verification</h2>
      <p>
        To help keep the community safe, members complete a verification step by uploading a government ID
        (Aadhaar, with PAN, Voter ID or Driving Licence as applicable) and a live selfie. Vehicle owners
        additionally upload their vehicle's registration certificate (RC) and driving licence to be badged as a
        "Verified Vehicle Owner." Documents are reviewed by our admin team before a "Verified" badge is granted.
        Submitting fraudulent, forged, or someone else's documents is a violation of these Terms and will result
        in account suspension.
      </p>

      <h2>5. Membership / platform fee</h2>
      <p>
        Access to premium features - hosting a trip, joining a trip, creating a travel club, and sending
        connection requests to other members - requires an active <strong>SastiTripsWale membership</strong>, a
        one-time (non-auto-renewing) payment for a fixed access period of either 6 months or 1 year. The
        membership fee is paid for access to the Platform's features, not for any specific trip, booking, or
        service delivered by a third party.
      </p>
      <p>
        Membership pricing has two tiers based on the travel-group composition you'd prefer to see and be
        matched into - a single-gender tier (Only Male or Only Female) and a mixed tier (Male + Female). This is
        a safety/comfort-oriented group-composition preference (for example, enabling women-only travel groups),
        not a dating, matchmaking, or relationship-matching feature. Current pricing is published on our{' '}
        <Link to="/pricing">Pricing page</Link> and shown again at checkout before you pay.
      </p>
      <p>
        Membership does not auto-renew and you are never charged automatically. When your membership expires,
        premium features are paused until you purchase a new membership period; your account, profile, and past
        trip history are not deleted.
      </p>
      <p>
        As an alternative to membership, SastiTripsWale also offers a <strong>Trip Pass</strong> - a flat,
        one-time fee (currently ₹29, ₹49, or ₹59, published on our <Link to="/pricing">Pricing page</Link>) that
        tops up a set number of "host" credits and "join" credits on your account, for members who'd rather try
        a handful of trips than commit to a membership period. A Trip Pass only covers hosting and joining a
        regular trip - creating or joining a travel club, sending connection requests, and messaging still
        require an active membership. Trip Pass pricing does not vary by travel-group preference, and coupon
        codes are never applicable to it. Hosting a trip spends one host credit; a join request that is
        ultimately accepted spends one join credit - a request that is withdrawn or declined is refunded
        automatically. Buying another Trip Pass adds to whatever credits you already have rather than resetting
        them.
      </p>

      <h2>6. Hosting a trip</h2>
      <ul>
        <li>You must have an active membership and a complete profile to host a trip.</li>
        <li>You are solely responsible for the accuracy of the trip details you post (dates, route, budget, seats, and any gender or Couples Mode restriction).</li>
        <li>As the organizer, you review and accept or decline join requests, and you may remove a member from your trip's group chat.</li>
        <li>Any budget figure you set is an estimate for other members' planning purposes only - it is not an invoice, and SastiTripsWale does not collect or disburse this amount.</li>
        <li>You may mark a trip's status (upcoming, ongoing, completed, cancelled) and are responsible for keeping it up to date.</li>
      </ul>

      <h2>7. Joining a trip</h2>
      <p>
        Sending a join request does not guarantee a seat - the trip's organizer may accept or decline it.
        Joining a trip is an arrangement between you and the other travelers on that trip; SastiTripsWale is not
        a party to it and is not responsible for the conduct of trip organizers or fellow participants, for the
        trip actually taking place, or for any cost-sharing arrangement between travelers.
      </p>

      <h2>8. Travel safety guidelines</h2>
      <p>
        All members are verified with a government ID and a live selfie before they can host or join trips (see
        Section 4). Verification reduces risk, but it does not eliminate it - you are responsible for your own
        safety on any trip, and we strongly recommend the following whenever you travel with co-travelers met
        through the Platform:
      </p>
      <ul>
        <li>
          Before you travel, share your co-traveler's details with a trusted friend or family member - their
          profile photo, mobile number, and your live location during the trip.
        </li>
        <li>Share an emergency contact number with your co-travelers, so someone can be reached quickly if needed.</li>
        <li>
          Discuss and agree fairly on how trip expenses will be split or contributed before the trip begins. If
          any member demands money beyond what was fairly agreed, report it to us with evidence (chat messages,
          screenshots, etc.) at <a href="mailto:support@sastitripswale.com">support@sastitripswale.com</a> or via
          the <Link to="/contact">Contact page</Link>, so we can take action against that member's account.
        </li>
      </ul>

      <h2>9. Community &amp; conduct rules</h2>
      <p>You agree not to, on or through the Platform:</p>
      <ul>
        <li>Harass, threaten, abuse, or discriminate against another member;</li>
        <li>Impersonate any person, or misrepresent your identity, age, or affiliation;</li>
        <li>Solicit money transfers, loans, or payments outside the Platform under false pretenses, or run any financial scam;</li>
        <li>Post spam, unsolicited advertising, or sexually explicit content;</li>
        <li>Use the member directory or connections/chat features to solicit dating, romantic, or commercial services unrelated to travel;</li>
        <li>Upload content you don't have the right to share, or that infringes another person's rights;</li>
        <li>Engage in or promote illegal activity of any kind.</li>
      </ul>
      <p>
        We may review reports, suspend, or ban accounts that violate these rules. See our community-safety
        features (block, report) described on the <Link to="/faq">FAQ</Link> page.
      </p>

      <h2>10. User-generated content</h2>
      <p>
        You retain ownership of the trip listings, photos, reviews, profile information, and messages you post
        ("your content"). By posting it on the Platform, you grant SastiTripsWale a non-exclusive, worldwide
        licence to host, display, and distribute that content as part of operating the Platform (for example,
        showing your trip photo in the community gallery). You are responsible for your content and confirm you
        have the right to post it.
      </p>

      <h2>11. Payments, cancellation &amp; refunds</h2>
      <p>
        Membership payments are processed through Razorpay. We do not store your card, UPI, or net-banking
        credentials. For full details on cancellation and refund eligibility, see our{' '}
        <Link to="/refund-policy">Cancellation &amp; Refund Policy</Link>.
      </p>

      <h2>12. Account suspension &amp; termination</h2>
      <p>
        We may suspend or terminate an account that violates these Terms, submits fraudulent verification
        documents, engages in unsafe or abusive conduct toward other members, or misuses the Platform. Where
        reasonably possible, we will explain the reason. Membership fees already paid are not refunded solely
        because of a suspension resulting from your violation of these Terms.
      </p>

      <h2>13. Intellectual property</h2>
      <p>
        The SastiTripsWale name, logo, and the Platform's design and code are owned by us and may not be copied
        or used without permission. You may use the Platform only as intended for your personal, non-commercial
        travel-community use.
      </p>

      <h2>14. Limitation of liability</h2>
      <p>
        SastiTripsWale connects travelers - it does not organize, supervise, insure, or guarantee any trip.
        <strong> To the maximum extent permitted by law, we are not liable for any injury, loss, cost, or
        damage arising from a trip, from another member's conduct, from cost-sharing arrangements between
        members, or from your reliance on information posted by another member.</strong> Travel involves
        inherent risk; you are responsible for your own safety decisions, travel insurance, and legal compliance
        (e.g. driving licences, permits) on any trip you host or join. Our liability for any claim relating to
        the Platform itself is limited to the membership fee you paid us in the 12 months before the claim
        arose.
      </p>

      <h2>15. Support &amp; disputes</h2>
      <p>
        For questions, complaints, or disputes, contact us first at{' '}
        <a href="mailto:support@sastitripswale.com">support@sastitripswale.com</a> or via the{' '}
        <Link to="/contact">Contact page</Link> - we aim to respond within 24 hours and resolve issues directly
        wherever possible.
      </p>

      <h2>16. Governing law</h2>
      <p>
        These Terms are governed by the laws of India. Courts at Mohali, Punjab shall have exclusive
        jurisdiction over any dispute arising from these Terms or your use of the Platform.
      </p>

      <h2>17. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. We will update the "Last updated" date above when we do.
        Continued use of the Platform after an update means you accept the revised Terms.
      </p>
    </LegalLayout>
  );
}
