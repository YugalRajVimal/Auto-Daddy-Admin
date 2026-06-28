import {
  shopHomeMenuButtonClass,
  shopHomeMenuButtonImageClass,
} from "./shopLayoutStyles";

const HOME_MENU_BUTTON_IMAGE =
  "https://download.logo.wine/logo/Windows_7/Windows_7-Logo.wine.png";

type ShopHomeMenuButtonProps = {
  onClick?: () => void;
};

export default function ShopHomeMenuButton({ onClick }: ShopHomeMenuButtonProps) {
  return (
    <button type="button" aria-label="Ad menu" className={shopHomeMenuButtonClass} onClick={onClick}>
      <img
        src={HOME_MENU_BUTTON_IMAGE}
        alt=""
        className={shopHomeMenuButtonImageClass}
        loading="lazy"
        decoding="async"
        aria-hidden
      />
    </button>
  );
}
