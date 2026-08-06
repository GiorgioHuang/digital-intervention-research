/**
 * What to call somebody the server could not name.
 *
 * It used to be impossible to reach this, because every unnamed person on
 * a conversation row became "A community member". That placeholder is
 * right where it was written — a stranger in a community space, described
 * rather than numbered, and described identically so the description
 * cannot be used to tell two people apart. It was wrong everywhere else it
 * ended up. An approved supporter is not a community member, and neither
 * is the participant a supporter supports; and because the placeholder is
 * the same for everybody, a participant with two supporters got two rows
 * they could not distinguish, on the one kind of conversation where
 * knowing who is writing is the entire point.
 *
 * This is worse to read and better to trust. Someone who sees it knows
 * the record is incomplete, rather than believing they have been told who
 * this is.
 */
export const nameOrGap = (name: string | null): string => name ?? 'Someone whose name is missing from this list';
