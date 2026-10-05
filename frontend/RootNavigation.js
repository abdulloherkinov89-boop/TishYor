import {
  CommonActions,
  createNavigationContainerRef,
} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

export function resetRoot(routeName) {
  if (!navigationRef.isReady()) {
    console.warn('ROOT NAVIGATION: ref hali tayyor emas; reset bekor qilindi:', routeName);
    return;
  }

  console.log('ROOT NAVIGATION: root stack reset yuborildi:', routeName);
  navigationRef.dispatch(
    CommonActions.reset({ index: 0, routes: [{ name: routeName }] }),
  );
}