import { ActionFunction, redirect } from '@remix-run/node';
import { Form } from '@remix-run/react';
import { db } from '~/utils/db.server';

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();

  const name = form.get('name');
  const content = form.get('content');

  if (typeof name !== 'string' || typeof content !== 'string') {
    throw new Error(`Form not submitted correctly.`);
  }

  const joke = await db.joke.create({
    data: { name, content },
  });

  return redirect(`/jokes/${joke.id}`);
};

const NewJoke = () => {
  return (
    <div>
      <main>
        <h1>Add your own joke:</h1>
        <Form method='post'>
          <div>
            <label htmlFor='name'>
              Name:
              <input type='text' name='name' />
            </label>
          </div>
          <div>
            <label htmlFor='content'>
              Content:
              <textarea name='content' />
            </label>
          </div>
          <div>
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
