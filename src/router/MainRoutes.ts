const MainRoutes = {
  path: '/main',
  meta: {
    requiresAuth: true
  },
  redirect: '/main/dashboard/default',
  component: () => import('@/layouts/default/DefaultLayout.vue'),
  children: [
    {
      name: 'LandingPage',
      path: '/',
      component: () => import('@/views/dashboards/default/DefaultDashboard.vue')
    },
    {
      name: 'Default',
      path: '/dashboard/default',
      component: () => import('@/views/dashboards/default/DefaultDashboard.vue')
    },
    {
      name: 'NewProject',
      path: '/project/new',
      component: () => import('@/views/project/NewProject.vue')
    },
    {
      name: 'ProjectView',
      path: '/project/:id',
      component: () => import('@/views/project/ProjectView.vue')
    }
  ]
};

export default MainRoutes;
