// components/AnimatedScreen.tsx
import React, { useEffect, useState } from "react";
import { InteractionManager, View, ViewStyle } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

type AnimatedScreenProps = React.PropsWithChildren<{
  style?: ViewStyle;
  delay?: number;
}>;

export default function AnimatedScreen({
  children,
  style,
  delay = 0,
}: AnimatedScreenProps) {
  // TypeScript: useState<boolean> gives "ready" a strict boolean type, so
  // it can only ever be true or false, nothing else can accidentally be
  // assigned to it. Starts false, we don't run the layout animation
  // immediately on mount.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // InteractionManager.runAfterInteractions schedules its callback to run
    // only after any in-flight native interaction has finished, including
    // a react-navigation screen transition. This is the key fix: it
    // prevents Reanimated's "entering" layout animation from trying to
    // mount native views on the same frame that react-native-screens is
    // still mounting/unmounting views for the navigation transition, which
    // is what was causing the Fabric "addViewAt: failed to insert view"
    // crash right after login.
    //
    // TypeScript: runAfterInteractions() returns a { cancel: () => void }
    // handle, not a plain value, so we can call .cancel() on it below.
    const task = InteractionManager.runAfterInteractions(() => {
      setReady(true);
    });

    // Cleanup function: if this component unmounts before the interaction
    // finishes (e.g. the user navigates away again quickly), cancel the
    // scheduled callback so it doesn't try to setState on an unmounted
    // component.
    return () => task.cancel();
  }, []);

  if (!ready) {
    // Render a plain, non-animated placeholder with the same layout style
    // so nothing visually jumps once the real animated content appears a
    // frame or two later. No entering prop here on purpose, this is the
    // "before the transition has settled" state.
    return <View style={style} />;
  }

  return (
    <Animated.View
      style={[style]}
      entering={FadeInDown.duration(320).delay(delay).springify().damping(18)}
    >
      {children}
    </Animated.View>
  );
}
