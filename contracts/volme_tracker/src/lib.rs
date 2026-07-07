#![no_std]
use soroban_sdk::{
    contract, contractimpl, symbol_short, vec, Address, Env, Symbol, Vec,
};

const FEE_BASIS_POINTS: i128 = 10;
const BASIS_POINTS_DIVISOR: i128 = 10000;

fn key_total_fees() -> Symbol {
    symbol_short!("tot_fees")
}

fn key_total_swaps() -> Symbol {
    symbol_short!("tot_swaps")
}

fn key_trader_volume(trader: &Address) -> (Symbol, Address) {
    (symbol_short!("vol__"), trader.clone())
}

fn key_trader_swap_count(trader: &Address) -> (Symbol, Address) {
    (symbol_short!("cnt__"), trader.clone())
}

fn key_trader_list() -> Symbol {
    symbol_short!("traders")
}

fn put_total_fees(env: &Env, val: i128) {
    env.storage().persistent().set(&key_total_fees(), &val);
}

fn get_total_fees(env: &Env) -> i128 {
    env.storage()
        .persistent()
        .get(&key_total_fees())
        .unwrap_or(0)
}

fn put_total_swaps(env: &Env, val: u32) {
    env.storage().persistent().set(&key_total_swaps(), &val);
}

fn get_total_swaps(env: &Env) -> u32 {
    env.storage()
        .persistent()
        .get(&key_total_swaps())
        .unwrap_or(0)
}

fn put_trader_volume(env: &Env, trader: &Address, val: i128) {
    env.storage()
        .persistent()
        .set(&key_trader_volume(trader), &val);
}

fn get_trader_volume(env: &Env, trader: &Address) -> i128 {
    env.storage()
        .persistent()
        .get(&key_trader_volume(trader))
        .unwrap_or(0)
}

fn put_trader_swap_count(env: &Env, trader: &Address, val: u32) {
    env.storage()
        .persistent()
        .set(&key_trader_swap_count(trader), &val);
}

fn get_trader_swap_count(env: &Env, trader: &Address) -> u32 {
    env.storage()
        .persistent()
        .get(&key_trader_swap_count(trader))
        .unwrap_or(0)
}

fn get_trader_list(env: &Env) -> Vec<Address> {
    env.storage()
        .persistent()
        .get(&key_trader_list())
        .unwrap_or(vec![&env])
}

fn put_trader_list(env: &Env, list: &Vec<Address>) {
    env.storage()
        .persistent()
        .set(&key_trader_list(), list);
}

#[contract]
pub struct VolmeTracker;

#[contractimpl]
impl VolmeTracker {
    pub fn record_swap(
        env: Env,
        trader: Address,
        sell_asset: Symbol,
        buy_asset: Symbol,
        sell_amount: i128,
        buy_amount: i128,
    ) {
        trader.require_auth();

        let fee = buy_amount * FEE_BASIS_POINTS / BASIS_POINTS_DIVISOR;

        let total_fees = get_total_fees(&env) + fee;
        put_total_fees(&env, total_fees);

        let total_swaps = get_total_swaps(&env) + 1;
        put_total_swaps(&env, total_swaps);

        let volume = get_trader_volume(&env, &trader) + buy_amount;
        put_trader_volume(&env, &trader, volume);

        let count = get_trader_swap_count(&env, &trader) + 1;
        put_trader_swap_count(&env, &trader, count);

        let mut list = get_trader_list(&env);
        if !list.contains(&trader) {
            list.push_back(trader.clone());
            put_trader_list(&env, &list);
        }

        env.events().publish(
            (symbol_short!("SwapRec"), trader, sell_asset, buy_asset),
            (sell_amount, buy_amount, fee),
        );
    }

    pub fn get_total_fees(env: Env) -> i128 {
        get_total_fees(&env)
    }

    pub fn get_total_swaps(env: Env) -> u32 {
        get_total_swaps(&env)
    }

    pub fn get_user_volume(env: Env, trader: Address) -> i128 {
        get_trader_volume(&env, &trader)
    }

    pub fn get_user_swap_count(env: Env, trader: Address) -> u32 {
        get_trader_swap_count(&env, &trader)
    }

    pub fn get_all_traders(env: Env) -> Vec<Address> {
        get_trader_list(&env)
    }
}

mod test;
