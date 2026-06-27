const HOME_MENU_BUTTON_IMAGE =
  "https://download.logo.wine/logo/Windows_7/Windows_7-Logo.wine.png";

const homeMenuButtonClass =
  "flex h-10 w-full max-w-[4.5rem] items-center justify-center rounded-xl transition-opacity hover:opacity-80 sm:h-11";

type ShopHomeMenuButtonProps = {
  onClick?: () => void;
};

export default function ShopHomeMenuButton({ onClick }: ShopHomeMenuButtonProps) {
  return (
    <button type="button" aria-label="Ad menu" className={homeMenuButtonClass} onClick={onClick}>
      <img
        src={HOME_MENU_BUTTON_IMAGE}
        alt=""
        className="h-14 w-14 object-contain sm:h-16 sm:w-16"
        loading="lazy"
        decoding="async"
        aria-hidden
      />
    </button>
  );
}
