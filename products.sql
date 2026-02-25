Create database if not exists products;

use products;

create table if not exists products (
    id int auto_increment primary key,
    name varchar(255) not null,
    price decimal(10, 2) not null,
    currency varchar(3) not null,
    stock int not null,
    rating decimal(3, 2) not null,
    subcategory_id int not null,
    create_at timestamp default current_timestamp,
    update_at timestamp default current_timestamp on update current_timestamp
);

create table if not exists subcategories (
    id int auto_increment primary key,
    name varchar(255) not null,
    category_id int not null,
    create_at timestamp default current_timestamp,
    update_at timestamp default current_timestamp on update current_timestamp
);

create table if not exists categories (
    id int auto_increment primary key,
    name varchar(255) not null,
    create_at timestamp default current_timestamp,
    update_at timestamp default current_timestamp on update current_timestamp
);