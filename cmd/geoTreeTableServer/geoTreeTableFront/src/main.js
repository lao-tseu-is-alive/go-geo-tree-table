/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */
// Composables
import { createApp } from "vue";
// Plugins
import { registerPlugins } from "@/plugins";
import { createPinia } from "pinia";
// Components
import { createVResizeDrawer } from "@wdns/vuetify-resize-drawer";
import App from "./App.vue";
const app = createApp(App);
registerPlugins(app);
app.use(createPinia());
app.use(createVResizeDrawer({}));
app.mount("#app");
