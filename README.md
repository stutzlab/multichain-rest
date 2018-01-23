# multichain-rest

This is a REST API over Multichain RPC calls with some easing for common features.

## Usage

You have to point Multichain REST to a running Multichain Node server. Do this by configuring the following ENV attributes:

* MULTICHAIN_HOST mymultichain.com
* MULTICHAIN_PORT 8000
* MULTICHAIN_USER multichainrpc
* MULTICHAIN_PASS mypassword

Run Multichain REST bridge
```docker run stutzlab/multichain-rest -e MULTICHAIN_HOST=mymultichain.com```

or use a sample [docker-compose.yml](https://raw.githubusercontent.com/stutzlab/multichain-rest/master/docker-compose.yml) file.

## API

[See general API documentation here](https://documenter.getpostman.com/view/689589/multichain-rest/7TMAXRZ
)

For POST operations, you can use the same body attributes as in:

  * <https://www.multichain.com/developers/json-rpc-api/>
  * <https://github.com/scoin/multichain-node/blob/development/lib/commands.js>

## Examples

* Create a new address with 'send' and 'receive' grants and store the private key in the connected multichain node wallet

```curl --request POST \
  --url http://localhost:6000/addresses \
  --header 'Content-Type: application/json' \
  --data '{
	"permissions":"send,receive"
}'```

* Issue 40 units of asset ABC into address 14ETi... with some textual details embeded to the transaction

```curl --request POST \
  --url 'http://localhost:6000/addresses/14ETiNnvSYF2764xXjiZVvcLZJVCRwaGDCgJ4T/issue' \
  --header 'Content-Type: application/json' \
  --data '{
	"asset": "ABC",
	"qty": 40,
	"units": 0.000001,
	"details": {"info": "i'\''m am an info about the issue!"}
}'```

* Send 10 ABCs from account 14ETi... to 1BJBK3... annotated with textual info "this is a test"

```curl --request POST \
  --url 'http://localhost:6000/addresses/14ETiNnvSYF2764xXjiZVvcLZJVCRwaGDCgJ4T/send_asset' \
  --header 'Content-Type: application/json' \
  --data '{
    "from": "14ETiNnvSYF2764xXjiZVvcLZJVCRwaGDCgJ4T",
    "to": "1BJBK32EWJVC4oum2VgLKNqtC7eXhuW52719gR",
	"asset": "ABC",
	"qty": 10,
	"data": "this is a test"
}
'```

* Get balances (one value for each asset at the address), but don't consider values that were locked

```curl --request GET \
  --url 'http://localhost:6000/addresses/14ETiNnvSYF2764xXjiZVvcLZJVCRwaGDCgJ4T/balance?includeLocked=false&minconf=1'```

* Get the transactions list for an address as Multichain returns it. Skip 3 transactions and limit to 2 results (paging)

```curl --request GET \
  --url 'http://localhost:6000/addresses/14ETiNnvSYF2764xXjiZVvcLZJVCRwaGDCgJ4T/transactions?skip=3&count=2'```
  
* Get the transactions list for an address in a simplified format (less data)

```curl --request GET \
  --url 'http://localhost:6000/addresses/14ETiNnvSYF2764xXjiZVvcLZJVCRwaGDCgJ4T/transactions?pretty=true'```
  
* Lock 0.111 ABC from address 14ET... so that other general wallet operations will not use it

```curl --request POST \
  --url 'http://localhost:6000/addresses/14ETiNnvSYF2764xXjiZVvcLZJVCRwaGDCgJ4T/locks' \
  --header 'Content-Type: application/json' \
  --data '{
	"asset":"ABC",
	"qty": 0.111
}'```

* Cancel the above lock

```curl --request DELETE \
  --url 'http://localhost:6000/addresses/14ETiNnvSYF2764xXjiZVvcLZJVCRwaGDCgJ4T/locks/c23ff9992d0c6310d56017bac5bce4c9f7d330be566993cb7fb255aaccde15ef/0' \
  --header 'Content-Type: application/json'```

* Exchange 11.1 DEF from account 14ET... by 0.111 ABC from account 1BJB...

```curl --request POST \
  --url http://localhost:6000/exchange \
  --header 'Content-Type: application/json' \
  --data '{
	"address_1": "{{address}}",
	"asset_1": "DEF",
	"qty_1": 11.1,
	"address_2": "{{address2}}",
	"asset_2": "ABC",
	"qty_2": 0.111
}'```

