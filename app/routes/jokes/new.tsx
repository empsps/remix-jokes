import { json, redirect } from '@remix-run/node';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import {
  Form,
  Link,
  useActionData,
  useCatch,
  useTransition,
} from '@remix-run/react';
import { db } from '~/utils/db.server';
import { getUserId, requireUserId } from '~/utils/session.server';
import { JokeDisplay } from '../components/joke';

const validateJokeName = (name: string) => {
  if (name.length < 3) {
    return 'This name is too short!';
  }
};

const validateJokeContent = (content: string) => {
  if (content.length < 10) {
    return 'This joke is too short!';
  }
};

type ActionData = {
  formError?: string;
  fieldErrors?: {
    name: string | undefined;
    content: string | undefined;
  };
  fields?: {
    name: string;
    content: string;
  };
};

const badRequest = (data: ActionData) => {
  return json(data, { status: 400 });
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  if (!userId) {
    throw new Response('Unauthorized', { status: 401 });
  }
  return json({});
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const form = await request.formData();

  let name = form.get('name');
  let content = form.get('content');

  if (typeof name !== 'string' || typeof content !== 'string') {
    return badRequest({
      formError: 'Form not submitted correctly.',
    });
  }

  name = name.replace(/\s+/g, ' ');
  content = content.replace(/\s+/g, ' ');

  const fieldErrors = {
    name: validateJokeName(name),
    content: validateJokeContent(content),
  };

  const fields = { name, content };

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({ fieldErrors, fields });
  }

  const joke = await db.joke.create({
    data: { ...fields, jokesterId: userId },
  });

  return redirect(`/jokes/${joke.id}`);
};

const NewJoke = () => {
  const actionData = useActionData<ActionData>();
  const transition = useTransition();

  if (transition.submission) {
    const name = transition.submission.formData.get('name');
    const content = transition.submission.formData.get('content');

    if (
      typeof name === 'string' &&
      typeof content === 'string' &&
      !validateJokeContent(content) &&
      !validateJokeName(name)
    ) {
      return (
        <JokeDisplay
          joke={{ name, content }}
          isOwner={true}
          canDelete={false}
        />
      );
    }
  }

  return (
    <div>
      <main>
        <h1>Add your own joke:</h1>
        <Form method='post'>
          <div>
            <label htmlFor='name'>
              Name:
              <input
                type='text'
                defaultValue={actionData?.fields?.name}
                name='name'
                aria-invalid={
                  Boolean(actionData?.fieldErrors?.name) || undefined
                }
                aria-errormessage={
                  actionData?.fieldErrors?.name ? 'name-error' : undefined
                }
              />
            </label>
            {actionData?.fieldErrors?.name ? (
              <p className='form-validation-error' role='alert' id='name-error'>
                {actionData.fieldErrors.name}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor='content'>
              Content:
              <textarea
                name='content'
                defaultValue={actionData?.fields?.content}
                aria-invalid={
                  Boolean(actionData?.fieldErrors?.content) || undefined
                }
                aria-errormessage={
                  actionData?.fieldErrors?.content ? 'content-error' : undefined
                }
              />
            </label>
            {actionData?.fieldErrors?.content ? (
              <p
                className='form-validation-error'
                role='alert'
                id='content-error'
              >
                {actionData.fieldErrors.content}
              </p>
            ) : null}
          </div>
          <div>
            {actionData?.formError ? (
              <p className='form-validation-error' role='alert'>
                {actionData.formError}
              </p>
            ) : null}
            <button type='submit' className='button'>
              Add joke
            </button>
          </div>
        </Form>
      </main>
    </div>
  );
};

export const CatchBoundary = () => {
  const caught = useCatch();

  if (caught.status === 401) {
    return (
      <div className='error-container'>
        <p>You must be logged in to create a joke.</p>
        <Link to='/login'>Login</Link>
      </div>
    );
  }
};

export function ErrorBoundary() {
  return (
    <div className='error-container'>
      Something unexpected went wrong. Sorry about that.
    </div>
  );
}

export default NewJoke;
