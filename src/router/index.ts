import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
  RouteRecordRaw,
} from "vue-router";
import EditorHome from "@/views/EditorHome.vue";
import MobileEditorHome from "@/views/MobileEditorHome.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    component:
      import.meta.env.VITE_TARGET === "mobile" ? MobileEditorHome : EditorHome,
    props: (route) => ({ projectFilePath: route.query["projectFilePath"] }),
  },
];

const router = createRouter({
  history:
    import.meta.env.VITE_TARGET === "web"
      ? createWebHistory(import.meta.env.BASE_URL)
      : createWebHashHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
