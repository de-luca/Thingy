DROP TABLE IF EXISTS banned;
DROP TABLE IF EXISTS post;
DROP TABLE IF EXISTS "user";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE "user" (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  login varchar(50) NOT NULL,
  password varchar(2000) NOT NULL
);

CREATE TABLE post (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  date timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "text" text NOT NULL,
  by uuid
);

CREATE TABLE banned (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ip varchar(15) NOT NULL
);

ALTER TABLE post
ADD CONSTRAINT FK_post_by FOREIGN KEY (by) REFERENCES "user"(id) ON DELETE CASCADE ON UPDATE CASCADE;
