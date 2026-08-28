import { Link } from 'react-router-dom';
import LegalLayout from '../components/LegalLayout.jsx';

export default function ShippingPolicy() {
  return (
    <LegalLayout
      tag="Legal"
      tagIcon="fa-solid fa-bolt"
      title="Shipping &"
      highlight="Delivery Policy"
      sub="SastiTripsWale is a digital platform - here's how access is delivered."
      seoTitle="Shipping & Delivery Policy"
      seoDescription="SastiTripsWale does not sell or ship physical products. Membership access is delivered digitally, instantly after payment is verified."
      path="/shipping-policy"
      updated="26 August 2026"
    >
      <h2>1. No physical products</h2>
      <p>
        SastiTripsWale does not sell, ship, or deliver any physical goods. Everything we offer - membership and
        the premium platform features it unlocks - is a digital service. There is nothing to pack, ship, or
        track by courier.
      </p>

      <h2>2. How membership access is delivered</h2>
      <p>
        Once your payment is successfully verified, your membership is activated <strong>automatically and
        instantly</strong> on your SastiTripsWale account - there is no waiting period, and nothing is mailed or
        couriered to you. Your account is immediately upgraded with the plan duration you purchased (6 months or
        1 year), and premium features (hosting a trip, joining a trip, creating a club, connecting with other
        members) unlock right away, once your profile is also complete.
      </p>

      <h2>3. If activation doesn't happen automatically</h2>
      <p>
        In the rare case a payment is confirmed by Razorpay but your membership does not activate automatically
        due to a technical issue, contact{' '}
        <a href="mailto:support@sastitripswale.com">support@sastitripswale.com</a> or use our{' '}
        <Link to="/contact">Contact page</Link> with your payment details - we will manually verify and activate
        your membership, typically within 24 hours. See our{' '}
        <Link to="/refund-policy">Cancellation &amp; Refund Policy</Link> for what happens if activation cannot
        be completed.
      </p>

      <h2>4. Trip photos &amp; uploaded documents</h2>
      <p>
        Any files you upload (profile photo, trip photos, gallery images, identity verification documents) are
        stored on our servers and made available to you (and, where applicable, other members) directly through
        the Platform - again, no physical shipping is involved.
      </p>
    </LegalLayout>
  );
}
