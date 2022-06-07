import requests
import uuid
from threading import Thread

DEFAULT_REQUEST_NUM = 25
DEFAULT_BIDDER_NUM = 5

BASE_URL = 'http://localhost:9000/'


def init_session(base_url, session_id):
    print('Session ID start', session_id)
    url = base_url + 'init_session'
    myobj = {
        "session_id": session_id,
        "estimated_traffic": DEFAULT_REQUEST_NUM,
        "bidders": [
            {
                "name": "bidder1",
                "endpoint": "http://192.168.0.4:10001/"
            },
            {
                "name": "bidder2",
                "endpoint": "http://192.168.0.4:10002"
            },
            {
                "name": "bidder3",
                "endpoint": "http://192.168.0.4:10003"
            },
            {
                "name": "bidder4",
                "endpoint": "http://192.168.0.4:10004"
            },
            {
                "name": "bidder5",
                "endpoint": "http://192.168.0.4:10005"
            }
        ],
        "bidder_setting": {
            "budget": 500 * (DEFAULT_REQUEST_NUM // DEFAULT_BIDDER_NUM),
            "impression_goal": DEFAULT_REQUEST_NUM // DEFAULT_BIDDER_NUM
        }
    }

    res = requests.post(url, json=myobj)
    print(res.json())


def bid_request(base_url, session_id):
    url = base_url + 'bid_request'
    for request_id in range(DEFAULT_REQUEST_NUM):
        request_id += 1
        print('Request id', request_id)
        myobj = {
            "floor_price": 50,
            "timeout_ms": 1000,
            "session_id": session_id,
            "user_id": "1",
            "request_id": str(request_id)
        }

        res = requests.post(url, json=myobj)
        print(res.json())


def end_session(base_url, session_id):
    print('End session id', session_id)
    url = base_url + 'end_session'
    myobj = {
        "session_id": session_id
    }

    res = requests.post(url, json=myobj)
    print(res.json())

class HTTPThread(Thread):
    def run(self):
        session_id = str(uuid.uuid1())
        try:
            test(session_id)
        except:
            print('Error', session_id)
			

def test(session_id=None):
    if session_id is None:
        session_id = str(uuid.uuid1())
    init_session(BASE_URL, session_id)
    bid_request(BASE_URL, session_id)
    end_session(BASE_URL, session_id)
if __name__ == '__main__':
    # Test 1 session
    test()
    # Test 100 session
    for i in range(100):
        t = HTTPThread()
        t.start()

