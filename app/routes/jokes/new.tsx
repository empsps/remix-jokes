import { json, redirect } from '@remix-run/node';
import type { ActionFunction } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { db } from '~/utils/db.server';

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

export const action: ActionFunction = async ({ request }) => {
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
    data: fields,
  });

  return redirect(`/jokes/${joke.id}`);
};

const NewJoke = () => {
  const actionData = useActionData<ActionData>();

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

export default NewJoke;
