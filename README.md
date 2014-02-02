QNNSHOP
=======

QNN Shop Application.

Please note that this repository is not being actively maintained.

![qnnshop](https://f.cloud.github.com/assets/1284703/2060111/b81b9fd0-8bfa-11e3-9668-db957531dd57.jpg)

---

NOTE: You may need to create a /secrets.yml containing following content for Alipay to work properly.

    alipayconfigs:
      seller_email: "example@example.com"
      pid: "208*************"
      key: "********************************"

NGINX
-----

    server {
      server_name <SERVER_NAME>;
      return 301 http://www.<SERVER_NAME>$request_uri;
    }

    upstream qnnshop_app {
      server unix:///srv/qnnshop/tmp/sockets/node.socket;
    }

    server {
      listen 80;
      server_name www.<SERVER_NAME>;
      client_max_body_size 1m;
      keepalive_timeout 5;
      root /srv/qnnshop/public;
      access_log /srv/qnnshop/log/production.access.log;
      error_log /srv/qnnshop/log/production.error.log info;
      error_page 500 502 503 504 /500.html;
      location = /500.html {
        root /srv/qnnshop/public;
      }
      try_files $uri/index.html $uri.html $uri @app;
      location @app {
        proxy_intercept_errors on;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;
        proxy_redirect off;
        proxy_pass http://qnnshop_app;
      }
    }

Developers
----------

* caiguanhao &lt;caiguanhao@gmail.com&gt;
