var Emitter  = require('./emitter'),
    utils    = require('./utils'),
    observer = new Emitter()

/**
 *  Auto-extract the dependencies of a computed property
 *  by recording the getters triggered when evaluating it.
 */
function catchDeps (binding) {
    if (binding.isFn) return
    utils.log('\n─ ' + binding.key)
    var has = []
    observer.on('get', function (dep) {
        if (has.indexOf(dep) > -1) return
        has.push(dep)
        utils.log('  └─ ' + dep.key)
        binding.deps.push(dep)
        dep.subs.push(binding)
    })
    binding.value.$get()
    observer.off('get')
}

module.exports = {

    /**
     *  the observer that catches events triggered by getters
     */
    observer: observer,

    /**
     *  parse a list of computed property bindings
     */
    parse: function (bindings) {
        utils.log('\nparsing dependencies...')
        observer.active = true
        bindings.forEach(catchDeps)
        observer.active = false
        utils.log('\ndone.')
    }
    
}