const assert = require('assert');
import fetch from 'node-fetch';
import {Effect, Types, Result, Action, perform} from '..';
import {update as updateCounter, init as initCounter, types} from './counter.js';

const actionTypes = Types('left', 'right', 'response', 'error');
const {left,right} = actionTypes;
const Left = Action.wrap(left);
const Right = Action.wrap(right);

const update = (state, action) => {
    const {left,right,response,error} = actionTypes;
    if(action.type === left) {
        const unwrapped = Action.unwrap(action);
        const {state: next, effect} = updateCounter(state.left, unwrapped);
        state.left = next;
        return Result(state, effect.map(Left));
    } else if(action.type === right) {
        const unwrapped = Action.unwrap(action);
        const {state: next, effect} = updateCounter(state.right, unwrapped);
        state.right = next;
        return Result(state, effect.map(Right));
    } else if(action.type === actionTypes.response) {
        const {data} = action;
        const {url, body} = data;
        // Handle response data here
        if(body.test === 'string data') {
            state.left = state.left+5;
            return Result(state);
        } else {
            return Result(state);
        }
    } else if (action.type === actionTypes.error) {
        const {data: error} = action;
        // Handle errors here
        state.left -= 3;
        return Result(state);
    }
};

const effectTypes = Types('request');

const init = () => {
    const {state: leftState, effect: leftEff} = initCounter();
    const {state: rightState, effect: rightEff} = initCounter();
    const req = Effect(effectTypes.request, {
        url: 'http://www.mocky.io/v2/56996086110000360c216ccc'
    });
    return Result(
        {
            left: leftState,
            right: rightState,
        },
        Effect.all([
            req,
            leftEff.map(Left),
            rightEff.map(Right)
        ]) // : Effect (List Action)
    );
};

const view = (state) => {
    console.log(state);
};


const performer = {
    matcher(effect) {
        if(effect.type === effectTypes.request) {
            return this.request;
        }
    },
    request: (effect) => {
        const {data} = effect;
        const {method, url, headers: h} = data;
        const headers = Object.assign(h || {}, {method});
        return fetch(url, headers)
        .then(response => {
            if(response.status >= 400 && response.status < 600) {
                return [Action(error, {
                    url,
                    message: 'Failed to perform HTTP request',
                    text: response.text
                })];
            } else {
                return response.json().then(jsonData => {
                    return [Action(actionTypes.response, {
                        url,
                        body: jsonData
                    })];
                });
            }
        })
        .catch(err => {
            return Action(actionTypes.error, {
                url,
                message: err.message,
                stack: err.stack
            });
        });
    },
};

const main = Effect.app({init, update, view, performer});
const {increment, incrementLater} = types;
main.next(Left(Action(increment)));
main.next(Right(Action(increment)));
main.next(Left(Action(increment)));
const act = Left(Action(incrementLater));
main.next(act);
