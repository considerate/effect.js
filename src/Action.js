import {typeName} from './Types.js';
const ActionProto = {
    toString() {
        const {type,data} = this;
        const name = typeName(type);
        if(data) {
            const {action} = data;
            if(action) {
                return 'Action('+name+', '+String(data.action)+')';
            } else {
                let dataString = String(data);
                if(dataString === '[object Object]') {
                    dataString = JSON.stringify(data);
                }
                return 'Action('+name+', '+dataString+')';
            }
        } else {
            return 'Action('+name+')';
        }
    }
};
export const Action = (type, data) => {
    const action = Object.create(ActionProto);
    return Object.assign(action,{type, data});
};
const to = (next,type,data) => action => next(Action(type, Object.assign(data || {}, {action})));
const wrap = (type, data) => action => Action(type, Object.assign(data || {}, {action}));
const unwrap = ({data:{action}}) => action;
Action.to = to;
Action.wrap = wrap;
Action.unwrap = unwrap;