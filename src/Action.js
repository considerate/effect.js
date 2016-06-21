import {typeName} from './Types.js';

// type Action = {type, data}

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
    action.type = type;
    action.data = data;
    return action;
};
const wrap = (type, wrapData) => action => {
    const data = {
        action: action,
    };
    if(wrapData) {
        Object.keys(wrapData).forEach(key => {
            if(key !== 'action') {
                data[key] = wrapData[key];
            }
        });
    }
    return Action(type, data);
};
const unwrap = ({data:{action}}) => action;
const to = (next,type,data) => action => next(wrap(type,data)(action));
Action.to = to;
Action.wrap = wrap;
Action.unwrap = unwrap;
