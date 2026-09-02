import modal from './EventModal.module.css';

/**
 * Placeholder for the lazily-loaded event modal.
 *
 * Without it the tap has no effect for the length of the chunk fetch: the page
 * stays fully interactive and visually unchanged, so a second tap sets a second
 * modal's state and both instances mount stacked once the chunk lands. Painting
 * the overlay straight away acknowledges the tap and swallows further clicks,
 * exactly as the real modal does.
 */
export function ModalFallback() {
  return <div className={modal.overlay} />;
}
