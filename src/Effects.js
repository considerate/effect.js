import {performWith, basePerformer, performer} from './perform.js';
import {effectString} from './pretty.js';
import {NONE, APPLY, ALL, CREATE} from './EffectTypes.js';

export {performWith, basePerformer, performer};

export const SideEffect = Symbol('SideEffect');

const EffectProto = {
    map(fn) {
        const mapped = apply(Effect(fn), this);
        return mapped;
    },
    toString() {
        return effectString(this);
    }
};

export const all = (effects) => {
    if(!Array.isArray(effects)) {
        throw new Error(`Need to pass array to Effects.all, got: ${JSON.stringify(effects)}`);
    }
    if(effects.length === 0) {
        return none;
    } else if(effects.length === 1) {
        const [effect] = effects;
        return effect;
    } else {
        return createEffect(
            ALL,
            {
                effects,
            }
        );
    }
};

export const apply = (f, x) => {
    if(f.type === ALL) {
        const {effects} = f.data;
        const applications = effects.map((e) => apply(e, x));
        return all(applications)
    } else if(x.type === ALL) {
        const {effects} = x.data;
        const applications = effects.map((e) => apply(f, e));
        return all(applications);
    } else if(f.type === CREATE) {
        if(x.type === CREATE) {
            return Effect(f.data(x.data));
        } else if (x[SideEffect]) {
            return createEffect(APPLY, {
                f,
                x,
            });
        } else {
            throw new Error(`Effects.apply expects both arguments to be Effects, got (${f}, ${x}).`);
        }
    } else if(x.type === CREATE) {
        const ap = (g) => g(x.data);
        const application = Effect(ap);
        return apply(application, f);
    } else if(f.type === NONE) {
        return x;
    } else if (f[SideEffect] && x[SideEffect]) {
        return createEffect(APPLY, {
            f,
            x,
        });
    } else {
        throw new Error(`Effects.apply expects both arguments to be Effects, got (${f}, ${x}).`);
    }
};

const createEffect = (type, data, performer) => {
    const effect = Object.create(EffectProto);
    effect[SideEffect] = true;
    return Object.assign(effect, {type, data, performer});
};

export const create = createEffect;

export const compose = (...effects) =>
    effects.reduceRight((b, a) => apply(a, b));

export const sequence = (...effects) =>
    effects.reduce((a, b) => apply(b, a));

export const seq = sequence;

export const none = createEffect(NONE);

function Effect(data) {
    if(data[SideEffect] === true) {
        //Effect(Effect(x)) == Effect(x);
        return data;
    } else {
        return createEffect(CREATE, data);
    }
}

export default Effect;
