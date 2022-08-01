import type { Joke } from '@prisma/client';
import type { LoaderFunction, MetaFunction } from '@remix-run/node';
import { Link, useLoaderData, useParams } from '@remix-run/react';
import { json } from '@remix-run/node';
import { db } from '~/utils/db.server';

type LoaderData = {
  joke: Pick<Joke, 'name' | 'content'>;
};

export const loader: LoaderFunction = async ({ params }) => {
  const joke = await db.joke.findUnique({
    where: { id: params.jokeId },
  });

  if (!joke) throw new Error('Joke not found');
  const data: LoaderData = { joke };
  return json(data);
};

export const meta: MetaFunction = ({ data }) => {
  return {
    title: `${data.joke.name ?? '404'} | Remix Jokes`,
    description: `${data.joke.content}`,
  };
};

const JokePage = () => {
  const { joke } = useLoaderData<LoaderData>();
  return (
    <div>
      <p>Here's a joke:</p>
      <p>{joke.content}</p>
      <Link to='.'>"{joke.name}" permalink</Link>
    </div>
  );
};

export function ErrorBoundary() {
  const { jokeId } = useParams();
  return (
    <div className='error-container'>
      Sorry, but the joke by the id of{' '}
      <code className='code-container'>{jokeId}</code> doesn't exist.
    </div>
  );
}

export default JokePage;
