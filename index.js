import "./src/nativewind"; // ensure nativewind stylesheet config loads before components
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);