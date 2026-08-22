// Shared between Notifications.jsx (the full activity page) and AppHome.jsx
// (the home-dashboard preview) so both render/link notifications identically.
export const NOTIF_ICON = {
  welcome: 'fa-solid fa-hand-holding-heart',
  trip_interest: 'fa-solid fa-fire',
  payment: 'fa-solid fa-credit-card',
  connection: 'fa-solid fa-user-plus',
  verification: 'fa-solid fa-circle-check',
  system: 'fa-solid fa-circle-info',
  group: 'fa-solid fa-users-rectangle',
  club: 'fa-solid fa-people-group',
  message: 'fa-solid fa-comment-dots',
  join_request: 'fa-solid fa-inbox',
  join_accepted: 'fa-solid fa-champagne-glasses',
  join_rejected: 'fa-solid fa-hand',
  follow: 'fa-solid fa-user-plus',
  message_request: 'fa-solid fa-inbox',
  influencer: 'fa-solid fa-star',
  admin_document: 'fa-solid fa-id-card',
  admin_query: 'fa-solid fa-headset',
  admin_influencer: 'fa-solid fa-star',
  admin_withdrawal: 'fa-solid fa-wallet',
  admin_report: 'fa-solid fa-flag',
};

// Where clicking a notification should take you, based on its type + meta.
export function notificationHref(n) {
  const meta = n.meta || {};
  switch (n.type) {
    case 'connection':
    case 'follow':
      return meta.senderId ? `/members/${meta.senderId}` : meta.userId ? `/members/${meta.userId}` : null;
    case 'group':
    case 'club':
    case 'message':
    case 'message_request':
      return meta.groupId ? `/chat/${meta.groupId}` : '/chat';
    case 'influencer':
      return '/dashboard?tab=settings&view=influencer';
    case 'join_request':
    case 'join_accepted':
    case 'join_rejected':
    case 'trip_interest':
      return meta.tripId ? `/trips/${meta.tripId}` : null;
    case 'payment':
      return '/dashboard?tab=settings&view=payments';
    case 'verification':
      return '/dashboard?tab=settings';
    case 'welcome':
      return '/dashboard';
    case 'admin_document':
      return '/admin/users';
    case 'admin_query':
    case 'admin_report':
      return '/admin/messages';
    case 'admin_influencer':
      return '/admin/influencers';
    case 'admin_withdrawal':
      return '/admin/wallet';
    default:
      return null;
  }
}
