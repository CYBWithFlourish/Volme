#![cfg(test)]

extern crate std;

use super::*;
use soroban_sdk::{
    symbol_short,
    testutils::{Address as _, Events},
    Env, TryFromVal, TryIntoVal, Val, Vec,
};

fn setup_test() -> (Env, Address, VolmeTrackerClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, VolmeTracker);
    let client = VolmeTrackerClient::new(&env, &contract_id);
    (env, contract_id, client)
}

#[test]
fn test_record_swap_fee_math() {
    let (env, _contract_id, client) = setup_test();
    let trader = Address::generate(&env);
    let sell_asset = symbol_short!("XLM");
    let buy_asset = symbol_short!("USDC");
    let sell_amount: i128 = 1000000000;
    let buy_amount: i128 = 500000000;

    client.record_swap(&trader, &sell_asset, &buy_asset, &sell_amount, &buy_amount);

    let expected_fee = buy_amount * FEE_BASIS_POINTS / BASIS_POINTS_DIVISOR;
    assert_eq!(expected_fee, 500000);

    let total_fees: i128 = client.get_total_fees();
    assert_eq!(total_fees, expected_fee);
}

#[test]
fn test_volume_and_count_accumulation() {
    let (env, _contract_id, client) = setup_test();
    let trader = Address::generate(&env);
    let sell_asset = symbol_short!("XLM");
    let buy_asset = symbol_short!("USDC");

    client.record_swap(&trader, &sell_asset, &buy_asset, &1000, &500);
    client.record_swap(&trader, &sell_asset, &buy_asset, &2000, &1000);
    client.record_swap(&trader, &sell_asset, &buy_asset, &3000, &1500);

    assert_eq!(client.get_user_volume(&trader), 500 + 1000 + 1500);
    assert_eq!(client.get_user_swap_count(&trader), 3);
    assert_eq!(client.get_total_swaps(), 3);
}

#[test]
fn test_multiple_traders() {
    let (env, _contract_id, client) = setup_test();
    let trader_a = Address::generate(&env);
    let trader_b = Address::generate(&env);
    let sell_asset = symbol_short!("XLM");
    let buy_asset = symbol_short!("USDC");

    client.record_swap(&trader_a, &sell_asset, &buy_asset, &1000, &500);
    client.record_swap(&trader_b, &sell_asset, &buy_asset, &2000, &1500);
    client.record_swap(&trader_a, &sell_asset, &buy_asset, &3000, &2500);

    assert_eq!(client.get_user_volume(&trader_a), 500 + 2500);
    assert_eq!(client.get_user_volume(&trader_b), 1500);
    assert_eq!(client.get_user_swap_count(&trader_a), 2);
    assert_eq!(client.get_user_swap_count(&trader_b), 1);

    let all_traders = client.get_all_traders();
    assert_eq!(all_traders.len(), 2);
    assert!(all_traders.contains(&trader_a));
    assert!(all_traders.contains(&trader_b));
}

#[test]
fn test_event_emission() {
    let (env, _contract_id, client) = setup_test();
    let trader = Address::generate(&env);
    let sell_asset = symbol_short!("XLM");
    let buy_asset = symbol_short!("USDC");
    let sell_amount: i128 = 1000;
    let buy_amount: i128 = 500;

    client.record_swap(&trader, &sell_asset, &buy_asset, &sell_amount, &buy_amount);

    let events = env.events().all();
    assert_eq!(events.len(), 1);

    let (_event_contract, topics, data) = events.get(0).unwrap();
    assert_eq!(topics.len(), 4);

    let swap_sym: Symbol = topics.get(0).unwrap().try_into_val(&env).unwrap();
    assert_eq!(swap_sym, symbol_short!("SwapRec"));

    let trader_addr: Address = topics.get(1).unwrap().try_into_val(&env).unwrap();
    assert_eq!(trader_addr, trader);

    let sell: Symbol = topics.get(2).unwrap().try_into_val(&env).unwrap();
    assert_eq!(sell, sell_asset);

    let buy: Symbol = topics.get(3).unwrap().try_into_val(&env).unwrap();
    assert_eq!(buy, buy_asset);

    let data_vec: Vec<Val> = Vec::try_from_val(&env, &data).unwrap();
    assert_eq!(data_vec.len(), 3);
    let amount: i128 = data_vec.get(1).unwrap().try_into_val(&env).unwrap();
    assert_eq!(amount, buy_amount);
}

#[test]
fn test_zero_amounts() {
    let (env, _contract_id, client) = setup_test();
    let trader = Address::generate(&env);
    let sell_asset = symbol_short!("XLM");
    let buy_asset = symbol_short!("USDC");

    client.record_swap(&trader, &sell_asset, &buy_asset, &0, &0);

    assert_eq!(client.get_total_fees(), 0);
    assert_eq!(client.get_user_volume(&trader), 0);
    assert_eq!(client.get_user_swap_count(&trader), 1);
}

#[test]
fn test_event_data_size() {
    let (env, _contract_id, client) = setup_test();
    let trader = Address::generate(&env);
    let sell_asset = symbol_short!("XLM");
    let buy_asset = symbol_short!("USDC");

    client.record_swap(&trader, &sell_asset, &buy_asset, &1000, &500);

    let events = env.events().all();
    assert_eq!(events.len(), 1);

    let (_event_contract, _topics, data) = events.get(0).unwrap();
    let data_vec: Vec<Val> = Vec::try_from_val(&env, &data).unwrap();
    assert_eq!(data_vec.len(), 3);
}
