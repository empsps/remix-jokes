import { json } from '@remix-run/node';
import type { LinksFunction, LoaderFunction } from '@remix-run/node';
import { Link, Outlet, useLoaderData } from '@remix-run/react';

import stylesUrl from '~/styles/jokes.css';
import { db } from '~/utils/db.server';
import type { Joke } from '@prisma/client';

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: stylesUrl }];
};

type JokeMinimal = Pick<Joke, 'id' | 'name'>;

type LoaderData = {
  jokeList: Array<JokeMinimal>;
};

export const loader: LoaderFunction = async () => {
  const data: LoaderData = {
    jokeList: await db.joke.findMany({
      take: 5,
      select: { id: true, name: true },
      orderBy: { createdAt: 'desc' },
    }),
  };
  return json(data);
};

const Jokes = () => {
  const { jokeList } = useLoaderData<LoaderData>();

  return (
    <div className='jokes-layout'>
      <header className='jokes-header'>
        <div className='container'>
          <h1 className='home-link'>
            <Link to='/' title='Remix Jokes' aria-label='Remix Jokes'>
              <span className='logo'>🤪</span>
              <span className='logo-medium'>J🤪KES</span>
            </Link>
          </h1>
        </div>
      </header>
      <main className='jokes-main'>
        <div className='container'>
          <div className='jokes-list'>
            <Link to='.'>Get a random joke</Link>
            <p>Here are a few more jokes to check out:</p>
            <ul>
              {jokeList.map((joke) => (
                <li key={joke.id}>
                  <Link to={joke.id}>{joke.name}</Link>
                </li>
              ))}
            </ul>
            <Link to='new' className='button'>
              Add your own
            </Link>
          </div>
          <div className='jokes-outlet'>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Jokes;
