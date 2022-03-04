import { constantRoutes } from '@/router'
import utils from '@/utils/utils'
import userApi from '@/api/modules/user'

/**
 * Use meta.role to determine if the current user has permission
 * @param roles
 * @param route
 */
function hasPermission(roles, route) {
  const isAdmin = roles.includes('admin')
  if (isAdmin) {
    return true
  }
  if (route.meta && route.meta.roles) {
    return roles.some(role => route.meta.roles.includes(role))
  } else {
    return true
  }
}

/**
 * Filter asynchronous routing tables by recursion
 * @param routes asyncRoutes
 * @param roles
 */
export function filterAsyncRoutes(routes, roles) {
  const res = []

  routes.forEach(route => {
    const tmp = { ...route }
    if (hasPermission(roles, tmp)) {
      if (tmp.children) {
        tmp.children = filterAsyncRoutes(tmp.children, roles)
      }
      res.push(tmp)
    }
  })

  return res
}

const state = {
  routes: [],
  addRoutes: []
}

const mutations = {
  SET_ROUTES: (state, routes) => {
    state.addRoutes = routes
    state.routes = constantRoutes.concat(routes)
  }
}

const actions = {
  generateRoutes({ commit }, roles) {
    return new Promise(resolve => {
      userApi.getMenus().then(data => {
        const menuTree = utils.toArrayTree(data, {
          strict: true
        })
        let accessedRoutes = utils.buildMenus(menuTree)

        // 我的收藏
        const myCollect = utils.buildCollectMenus(accessedRoutes)
        accessedRoutes = [myCollect, ...accessedRoutes]

        const flatRoutes = utils.buildFlagRouters(accessedRoutes)

        commit('SET_ROUTES', accessedRoutes)
        resolve(flatRoutes)
      })
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
