const userQuery = {
    GET_USER: "SELECT * FROM user WHERE username = ?;",
    POST_USER: "INSERT INTO user (email, password, created_at, username) VALUES (?,?,Now(),?);",
    POST_ROLE: "INSERT INTO user_roles (user_id, role_id) VALUES (LAST_INSERT_ID(), 2);",
};

module.exports = userQuery;
