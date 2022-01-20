import { createLogger, createStore, Store } from 'vuex'
import { UserAuthentication, User } from './model/User'
import dataService from './services/DataService'
import router from './router'
import { InjectionKey } from 'vue'
import { ServerSettings } from './model/ServerSettings'

export interface State {
  count: number,
  isLogged: boolean,
  isInitialSetup : boolean,
  user : User | null,
  entryPoint: string,
  serverSettings: ServerSettings
}

export const key: InjectionKey<Store<State>> = Symbol()

// Create a new store instance.
const store = createStore<State>({
  state () {
    return {
      count: 0,
      isLogged: false,
      isInitialSetup : false,
      user: null,
      entryPoint: '/',
      serverSettings: {
        metadataFetchEnabled: false,
        metadataFetchCalibreEnabled: false
      } as ServerSettings
    }
  },
  mutations: {
    increment (state) {
      state.count++
    },
    login(state, isLogged) {
        state.isLogged = isLogged
    },
    initialSetup(state, isInitialSetup) {
      state.isInitialSetup = isInitialSetup
    },
    user(state, user: User) {
      state.user = user
    },
    entryPoint(state, entryPoint: string) {
      state.entryPoint = entryPoint
    },
    serverSettings(state, serverSettings: ServerSettings) {
      state.serverSettings = serverSettings
    },
  },
  actions: {
      async setupStatus({commit, state}) {
        commit('initialSetup', await dataService.setupStatus())
      },
      async getUser({commit}) {
        try {
          const auth: UserAuthentication = await dataService.getUser()
          console.log('store auth')
          console.log(auth)
          commit('login', true)
          commit('user', auth.user)
          // await router.push({name: 'home'})
        } catch (error) {
          commit('login', false)
          throw error
        }
      },
      async authenticate({dispatch, commit, state}, payload) {
        try {
          const user: User = await dataService.authenticateUser(payload.user, payload.password)
          console.log('store authenticate')
          console.log(user)
          commit('login', true)
          commit('user', user)
          dispatch('getServerSettings')
          await router.push({path: state.entryPoint})
        } catch (error) {
          commit('login', false)
          throw error
        }
      }, 
      async createInitialUser({dispatch, commit, state}, payload) {
        const user: User = await dataService.createUser(payload.user, payload.password)
        console.log('created')
        console.log(user)
        await dispatch('authenticate', {"user" : payload.user, "password" : payload.password})
        await dispatch('setupStatus')
      },
      logout({dispatch, commit, state}) {
        commit('login', false)
        commit('user', null)
        router.push({name: 'login'})
      },
      async getServerSettings({commit}) {
        dataService.serverSettings()
          .then(res => {
            console.log(res)
            commit('serverSettings', res)
          })
          .catch(err => {
            return err
          })
      },

  },
  getters : {
    getUsername(state): string {
      return state.user != null ? state.user.login : 'anonymous'
    },
    isAdmin(state): boolean {
      return state.user != null && state.user.isAdmin
    },
    getSettings(state): ServerSettings {
      return state.serverSettings
    }
  }, 
  plugins : [createLogger()],
  strict: true
})

export default store
