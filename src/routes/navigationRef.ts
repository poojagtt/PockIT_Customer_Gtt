// import {
//   createNavigationContainerRef,
//   StackActions,
// } from '@react-navigation/native';

// export const navigationRef = createNavigationContainerRef();

// export function navigate(name: string, params?: any) {
//   if (navigationRef.isReady()) {
//     // @ts-ignore
//     navigationRef.navigate(name as never, params as never);
//   }
// }

// export function push(name: string, params?: any) {
//   if (navigationRef.isReady()) {
//     navigationRef.dispatch(StackActions.push(name, params));
//   }
// }

// export function goBack() {
//   if (navigationRef.isReady() && navigationRef.canGoBack()) {
//     navigationRef.goBack();
//   }
// }



import {
  createNavigationContainerRef,
  StackActions,
} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name: string, params?: any) {
  if (navigationRef.isReady()) {
    // @ts-ignore
    navigationRef.navigate(name as never, params as never);
  }
}

export function push(name: string, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.push(name, params));
  }
}

export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}
