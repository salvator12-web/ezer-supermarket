// The backend Order model uses snake_case status values (see backend/models/Order.js).
// The Track page's progress UI was built with camelCase step names + matching
// i18n keys (track.pickedUp, track.onTheWay, ...). This keeps that UI as-is
// and just translates between the two.
export const STATUS_STEPS = ['pending', 'accepted', 'pickedUp', 'onTheWay', 'delivered'];

const BACKEND_TO_STEP = {
  pending: 'pending',
  accepted: 'accepted',
  picked_up: 'pickedUp',
  on_the_way: 'onTheWay',
  delivered: 'delivered',
  cancelled: 'cancelled',
};

export function toStep(backendStatus) {
  return BACKEND_TO_STEP[backendStatus] || backendStatus;
}
