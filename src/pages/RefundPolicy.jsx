import { Link } from 'react-router-dom';
import LegalLayout from '../components/LegalLayout.jsx';

export default function RefundPolicy() {
  return (
    <LegalLayout
      tag="Legal"
      tagIcon="fa-solid fa-rotate-left"
      title="Cancellation &"
      highlight="Refund Policy"
      sub="When your membership or Trip Pass payment is refundable, and how to request it."
      seoTitle="Cancellation & Refund Policy"
      seoDescription="SastiTripsWale's cancellation and refund policy for the membership/platform fee and the Trip Pass - what's refundable, what isn't, and how failed or duplicate payments are handled."
      path="/refund-policy"
      updated="26 August 2026"
    >
      <h2>1. What you're paying for</h2>
      <p>
        SastiTripsWale collects payment for two things, both platform/access fees rather than a payment for any
        specific trip, booking, or third-party service: the <strong>membership fee</strong> - a one-time payment
        that unlocks premium features (hosting a trip, joining a trip, creating a club, and connecting with
        other members) for a fixed period of 6 months or 1 year - and the <strong>Trip Pass</strong>, a one-time
        flat fee that tops up a set number of trip-hosting and trip-joining credits instead of a time period. See
        Section 2 for how the Trip Pass specifically works. Neither auto-renews.
      </p>

      <h2>2. Trip Pass (pay-per-trip) fee</h2>
      <p>
        SastiTripsWale also offers a <strong>Trip Pass</strong> - a flat, one-time fee (₹29/₹49/₹59, see our{' '}
        <Link to="/pricing">Pricing page</Link>) that tops up host and join credits instead of a fixed access
        period. Once activated (credits added to your account), a Trip Pass purchase is <strong>non-refundable</strong>,
        under the same exceptions as membership in Section 3 below. No coupon codes are ever applicable to a Trip
        Pass purchase. A credit is refunded automatically - without contacting support - if a join request it
        was spent on is later withdrawn or declined, or if a trip it was spent on is deleted before anyone joins;
        see our <Link to="/terms">Terms &amp; Conditions</Link> for exactly how credits are spent and refunded as
        part of normal use. This automatic in-app refund is separate from - and doesn't require - the manual
        payment-refund process below.
      </p>

      <h2>3. Membership cancellation</h2>
      <p>
        Because membership is a one-time payment for a fixed access period (not a recurring subscription), there
        is nothing to "cancel" in the sense of stopping future charges - you are never charged automatically.
        If you no longer wish to use the Platform, you can simply stop using it; your membership will remain
        active until its expiry date and will not renew unless you choose to purchase another period. The same
        applies to a Trip Pass - there's no recurring charge to cancel, and unused credits simply remain on your
        account until you use them.
      </p>

      <h2>4. Refund eligibility</h2>
      <p>Once a membership or Trip Pass payment is successfully verified and applied to your account, it is <strong>non-refundable</strong>, except in the specific situations below:</p>
      <ul>
        <li><strong>Payment deducted, nothing activated</strong> - if Razorpay confirms a successful charge but your membership/credits were not applied within a reasonable time due to a technical error on our side, we will either activate them manually or issue a full refund.</li>
        <li><strong>Duplicate payment</strong> - if you were charged more than once for the same membership period or Trip Pass due to a technical glitch, we will refund the duplicate charge in full.</li>
        <li><strong>Unauthorized/failed transaction later confirmed as charged</strong> - if Razorpay's records show a charge that never reached us or was reversed, and nothing was credited to your account, we will investigate and refund what is owed.</li>
      </ul>
      <p>
        Refunds are not available simply because you changed your mind after activation, could not find a
        suitable trip, or another member's trip did not go as planned - SastiTripsWale is a community platform,
        not a booking or event-guarantee service.
      </p>

      <h2>5. Failed payment</h2>
      <p>
        If your payment fails or is cancelled before completion, no amount is deducted and nothing is activated.
        You can simply retry the payment from the Join page. If your bank or payment app shows a deduction for a
        payment that our system shows as failed, see "Duplicate payment / money deducted" below.
      </p>

      <h2>6. Duplicate payment / payment deducted but nothing granted</h2>
      <p>
        If money was deducted from your account but you did not receive a membership or Trip Pass confirmation,
        do not retry the payment repeatedly. Instead, contact us at{' '}
        <a href="mailto:support@sastitripswale.com">support@sastitripswale.com</a> or via the{' '}
        <Link to="/contact">Contact page</Link> with your registered email/mobile number, the approximate time
        of payment, and (if available) the payment reference shown by your bank or UPI app. We will check the
        transaction against our Razorpay records and either activate what you paid for or refund you within a
        reasonable time, typically within 7 business days of verification.
      </p>

      <h2>7. Membership expiration</h2>
      <p>
        When your membership period ends, premium features (hosting/joining trips, creating clubs, connecting
        with members) are paused until you purchase a new membership period. Your account, profile, past trips,
        and chat history are not deleted or affected by expiry. Membership fees are not refunded for the expired
        period, since the access period was fully delivered. A Trip Pass has no expiry date of its own - it
        simply runs out when its credits are used.
      </p>

      <h2>8. How refunds are issued</h2>
      <p>
        Approved refunds are issued to the original payment method via Razorpay and typically reflect in your
        account within 5-7 business days, depending on your bank or payment provider.
      </p>

      <h2>9. Contact for refund requests</h2>
      <p>
        Email <a href="mailto:support@sastitripswale.com">support@sastitripswale.com</a> or use our{' '}
        <Link to="/contact">Contact page</Link>. We respond within 24 hours.
      </p>
    </LegalLayout>
  );
}
