import { Form } from '@remix-run/react';

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
