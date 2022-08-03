import type { Joke } from '@prisma/client';
import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Link, useCatch, useLoaderData } from '@remix-run/react';
import { db } from '~/utils/db.server';

type LoaderData = {
  randomJoke: Pick<Joke, 'id' | 'name' | 'content'>;
};

export const loader: LoaderFunction = async () => {
  const count = await db.joke.count();
  const randomRowNumber = Math.floor(Math.random() * count);
  const [randomJoke] = await db.joke.findMany({
    take: 1,
    skip: randomRowNumber,
  });

  if (!randomJoke) {
    throw new Response('No random joke found', {
      status: 404,
    });
  }

  const data: LoaderData = { randomJoke: randomJoke };

  return json(data);
};

const JokesPage = () => {
  const { randomJoke } = useLoaderData<LoaderData>();
  return (
    <div>
      <p>Here's a random joke:</p>
      <p>{randomJoke.content}</p>
      <Link to={randomJoke.id}>"{randomJoke.name}" permalink</Link>
    </div>
  );
};

export const CatchBoundary = () => {
  const caught = useCatch();

  if (caught.status === 404) {
    return (
      <div className='error-container'>There are no jokes to display.</div>
    );
  }
  throw new Error(`Unexpected caught response with status: ${caught.status}`);
};

export const ErrorBoundary = () => {
  return <div className='error-container'>I did a whoopsies.</div>;
};

export default JokesPage;
