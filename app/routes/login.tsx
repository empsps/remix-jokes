import type { ActionFunction, LinksFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, Link, useActionData, useSearchParams } from '@remix-run/react';
import stylesUrl from '~/styles/login.css';
import { db } from '~/utils/db.server';
import { createUserSession, login, register } from '~/utils/session.server';

type ActionData = {
  formError?: string;
  fieldErrors?: {
    username: string | undefined;
    password: string | undefined;
  };
  fields?: {
    loginType: string;
    username: string;
    password: string;
  };
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: stylesUrl }];
};

const validateUsername = (username: unknown) => {
  if (typeof username !== 'string' || username.length < 3) {
    return `Usernames must be at least 3 characters long`;
  }
};

const validatePassword = (password: unknown) => {
  if (typeof password !== 'string' || password.length < 6) {
    return `Passwords must be at least 6 characters long`;
  }
};

function validateUrl(url: any) {
  console.log(url);
  let urls = ['/jokes', '/', 'https://remix.run'];
  if (urls.includes(url)) {
    return url;
  }
  return '/jokes';
}

const badRequest = (data: ActionData) => {
  return json(data, { status: 400 });
};

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();

  const loginType = form.get('loginType');
  let username = form.get('username');
  let password = form.get('password');

  const redirectTo = validateUrl(form.get('redirectTo') || '/jokes');

  if (
    typeof loginType !== 'string' ||
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    typeof redirectTo !== 'string'
  ) {
    return badRequest({
      formError: `Form not submitted correctly.`,
    });
  }

  username = username.replace(/\s+/g, ' ');
  password = password.replace(/\s+/g, ' ');

  const fieldErrors = {
    username: validateUsername(username),
    password: validatePassword(password),
  };

  const fields = {
    loginType,
    username,
    password,
  };

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({ fieldErrors, fields });
  }

  switch (loginType) {
    case 'login': {
      const user = await login({ username, password });
      console.log({ user });
      if (!user) {
        return badRequest({
          fields,
          formError: `Username/password combination is incorrect`,
        });
      }
      return createUserSession(user.id, redirectTo);
    }
    case 'register': {
      const userExists = await db.user.findFirst({
        where: { username },
      });
      if (userExists) {
        return badRequest({
          fields,
          formError: `User with username ${username} already exists`,
        });
      }
      const user = await register({ username, password });
      if (!user) {
        return badRequest({
          fields,
          formError: 'Something went wrong trying to create a new user.',
        });
      }
      console.log({ user });
      return createUserSession(user.id, redirectTo);
    }
    default: {
      return badRequest({
        fields,
        formError: `Login type invalid`,
      });
    }
  }
};

const Login = () => {
  const [searchParams] = useSearchParams();
  const actionData = useActionData<ActionData>();
  return (
    <div className='container'>
      <div className='content' data-light=''>
        <h1>Login</h1>
        <Form method='post'>
          <input
            type='hidden'
            name='redirectTo'
            value={searchParams.get('redirectTo') ?? undefined}
          />
          <fieldset>
            <legend className='sr-only'>Login or Register?</legend>
            <label>
              <input
                type='radio'
                name='loginType'
                value='login'
                defaultChecked={
                  !actionData?.fields?.loginType ||
                  actionData?.fields?.loginType === 'login'
                }
              />
              Login
            </label>
            <label>
              <input
                type='radio'
                name='loginType'
                value='register'
                defaultChecked={actionData?.fields?.loginType === 'register'}
              />
              Register
            </label>
          </fieldset>
          <div>
            <label htmlFor='username-input'>Username</label>
            <input
              defaultValue={actionData?.fields?.username}
              type='text'
              id='username-input'
              name='username'
              aria-invalid={
                Boolean(actionData?.fieldErrors?.username) || undefined
              }
              aria-errormessage={
                actionData?.fieldErrors?.username ? 'username-error' : undefined
              }
            />
            {actionData?.fieldErrors?.username ? (
              <p className='form-validation-error' role='alert' id='name-error'>
                {actionData.fieldErrors.username}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor='password-input'>Password</label>
            <input
              defaultValue={actionData?.fields?.password}
              type='password'
              name='password'
              id='password-input'
              aria-invalid={
                Boolean(actionData?.fieldErrors?.password) || undefined
              }
              aria-errormessage={
                actionData?.fieldErrors?.password ? 'password-error' : undefined
              }
            />
            {actionData?.fieldErrors?.password ? (
              <p
                className='form-validation-error'
                role='alert'
                id='password-error'
              >
                {actionData.fieldErrors.password}
              </p>
            ) : null}
          </div>
          {actionData?.formError ? (
            <p className='form-validation-error' role='alert'>
              {actionData.formError}
            </p>
          ) : null}
          <button type='submit' className='button'>
            Continue
          </button>
        </Form>
      </div>
      <div className='links'>
        <ul>
          <li>
            <Link to='/'>Home</Link>
          </li>
          <li>
            <Link to='/jokes'>Jokes</Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Login;
