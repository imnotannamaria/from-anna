/**
 * How many photographed sheets one letter holds.
 *
 * One number, read on both sides: the uploader in the browser and the route
 * and the database helpers on the server. It lives in a file that imports
 * nothing, so neither side pulls the other's dependencies in to read it.
 *
 * Five, because every page goes to the model in one call as a `data:` URL,
 * and the cap is what keeps that request a sensible size.
 */
export const MAX_PAGES_PER_LETTER = 5
