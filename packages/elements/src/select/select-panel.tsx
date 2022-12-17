import {
  callHandler,
  contains,
  createPolymorphicComponent,
  mergeDefaultProps,
  mergeRefs,
} from "@kobalte/utils";
import { JSX, splitProps } from "solid-js";
import { Dynamic } from "solid-js/web";

import { usePopoverContext } from "../popover/popover-context";
import { createFocusTrapRegion, createOverlay } from "../primitives";
import { useSelectContext } from "./select-context";

export interface SelectPanelProps {
  /** The HTML styles attribute (object form only). */
  style?: JSX.CSSProperties;

  /**
   * Used to force keeping the panel visible when more control is needed.
   * Useful when controlling animation with SolidJS animation libraries.
   */
  keepVisible?: boolean;
}

export const SelectPanel = createPolymorphicComponent<"div", SelectPanelProps>(props => {
  let ref: HTMLElement | undefined;

  const popoverContext = usePopoverContext();
  const context = useSelectContext();

  props = mergeDefaultProps({ as: "div" }, props);

  const [local, others] = splitProps(props, [
    "as",
    "ref",
    "id",
    "style",
    "keepVisible",
    "onKeyDown",
  ]);

  const keepVisible = () => local.keepVisible || context.isOpen();

  const { overlayHandlers } = createOverlay(
    {
      isOpen: context.isOpen,
      onClose: context.close,
      isModal: false,
      preventScroll: false,
      closeOnEsc: true,
      closeOnInteractOutside: true,
      shouldCloseOnInteractOutside: element => !contains(context.triggerRef(), element),
    },
    () => ref
  );

  const { FocusTrap } = createFocusTrapRegion(
    {
      trapFocus: context.isOpen,
      autoFocus: false, // Handled by the select listbox.
      restoreFocus: false, // Handled by the select
    },
    () => ref
  );

  const onKeyDown: JSX.EventHandlerUnion<any, KeyboardEvent> = e => {
    callHandler(e, local.onKeyDown);
    callHandler(e, overlayHandlers.onKeyDown);
  };

  return (
    <>
      <FocusTrap />
      <Dynamic
        ref={mergeRefs(el => {
          popoverContext.setPanelRef(el);
          ref = el;
        }, local.ref)}
        component={local.as}
        hidden={!keepVisible()}
        style={{
          position: "relative",
          display: !keepVisible() ? "none" : undefined,
          ...local.style,
        }}
        onKeyDown={onKeyDown}
        {...others}
      />
      <FocusTrap />
    </>
  );
});