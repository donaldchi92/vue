import Watcher from '../observer/watcher'
import { query, resolveAsset, hyphenate, hasOwn } from '../util/index'
import { createElement, patch, updateListeners } from '../vdom/index'
import { callHook } from './lifecycle'

export const renderState = {
  activeInstance: null
}

export function initRender (vm) {
  vm._vnode = null
  vm._mounted = false
  vm._renderData = vm.$options._renderData
  vm.$slots = {}
  // props are set in initState
  resolveSlots(vm, vm.$options._renderChildren)
  const el = vm.$options.el
  if (el) {
    vm.$mount(el)
  }
}

function resolveSlots (vm, children) {
  if (children) {
    const slots = { default: children }
    let i = children.length
    let name, child
    while (i--) {
      child = children[i]
      if ((name = child.data && child.data.slot)) {
        (slots[name] || (slots[name] = [])).push(child)
        children.splice(i, 1)
      }
    }
    vm.$slots = slots
  }
}

function mergeParentAttrs (vm, data, parentData) {
  if (parentData.attrs) {
    const props = vm.$options.props
    for (let key in parentData.attrs) {
      if (!hasOwn(props, key)) {
        data.attrs[key] = parentData.attrs[key]
      }
    }
  }
}

function mergeParentDirectives (vm, data, parentData) {
  if (parentData.directives) {
    data.directives = parentData.directives.conact(data.directives || [])
  }
}

function updateParentCallbacks (vm, data, parentData) {
  if (parentData.on) {
    updateListeners(parentData.on, data.on || {}, (event, handler) => {
      vm.$on(event, handler)
    })
  }
}

export function renderMixin (Vue) {
  // shorthands used in render functions
  Vue.prototype.__h__ = createElement
  Vue.prototype.__d__ = function (id) {
    return resolveAsset(this.$options, 'directives', id, true)
  }

  Vue.prototype._update = function (vnode) {
    callHook(this, 'beforeUpdate')
    if (!this._vnode) {
      this.$el = patch(this.$el, vnode)
    } else {
      this.$el = patch(this._vnode, vnode)
    }
    this._vnode = vnode
    callHook(this, 'updated')
  }

  Vue.prototype._tryUpdate = function (data, children) {
    this._renderData = data
    if (children) {
      resolveSlots(this, children)
      this.$forceUpdate()
      return
    }
    // set props if they have changed.
    const attrs = data && data.attrs
    if (attrs) {
      for (let key in this.$options.props) {
        let newVal = hasOwn(attrs, key)
          ? attrs[key]
          : attrs[hyphenate(key)]
        if (this[key] !== newVal) {
          this[key] = newVal
        }
      }
    }
  }

  Vue.prototype._render = function () {
    const prev = renderState.activeInstance
    renderState.activeInstance = this
    const vnode = this.$options.render.call(this)
    const data = vnode.data
    const parentData = this._renderData
    if (parentData) {
      mergeParentAttrs(this, data, parentData)
      mergeParentDirectives(this, data, parentData)
      updateParentCallbacks(this, data, parentData)
    }
    renderState.activeInstance = prev
    return vnode
  }

  Vue.prototype.$mount = function (el) {
    callHook(this, 'beforeMount')
    this.$el = el && query(el)
    if (this.$el) {
      this.$el.innerHTML = ''
    }
    this._watcher = new Watcher(this, this._render, this._update)
    this._update(this._watcher.value)
    callHook(this, 'mounted')
    this._mounted = true
    return this
  }

  Vue.prototype.$forceUpdate = function () {
    this._watcher.update()
  }
}
