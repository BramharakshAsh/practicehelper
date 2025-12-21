CREATE OR REPLACE FUNCTION login(_username text, _password text, _role user_role)
RETURNS SETOF users AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM users
  WHERE username = _username AND password_hash = crypt(_password, password_hash) AND role = _role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;