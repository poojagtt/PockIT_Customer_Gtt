import {NavigationProp} from '@react-navigation/native';
import {TabRoutes} from '../routes'; // TabRoutes should include 'Order', 'Cart', etc.
/**
 * Reset the stack and navigate to a specific screen inside a tab.
 *
 * @param navigation - The navigation prop from React Navigation.
 * @param tabName - The tab to navigate to (e.g., 'Order', 'Cart').
 * @param screenName - The screen to navigate to inside the tab (e.g., 'OrderList').
 * @param params - Optional parameters to pass to the target screen.
 */
export const resetAndNavigate = <T extends keyof TabRoutes>(
  navigation: NavigationProp<TabRoutes>,
  tabName: T,
  screenName: string,
  params?: object,
) => {
  navigation.reset({
    index: 0, // Reset the navigation stack at the root
    routes: [
      {
        name: tabName, // Navigate to the specified tab (e.g., 'Order')
        state: {
          index: 0, // Ensure the stack inside the tab starts fresh
          routes: [{name: screenName, params}], // Go directly to the specified screen
        },
      },
    ],
  });
};
