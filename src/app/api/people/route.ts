import { NextRequest, NextResponse } from 'next/server';
import { getAllPeople, addPerson, removePerson, searchPersonBrave } from '@/lib/people';
import { log } from '@/lib/logger';

export async function GET() {
  try {
    const people = await getAllPeople();
    return NextResponse.json(people);
  } catch (err) {
    log.error('Failed to fetch people', err);
    return NextResponse.json({ error: 'Failed to fetch people' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 });

    // Search Brave for info about this person
    const info = await searchPersonBrave(name.trim());
    const fixedName = info.fixedName ?? name.trim();

    const person = await addPerson({
      name: fixedName,
      photo_url: info.photo_url ?? undefined,
      role: info.role,
      metadata: info.description || undefined,
    });

    return NextResponse.json(person, { status: 201 });
  } catch (err) {
    log.error('Failed to add person', err);
    return NextResponse.json({ error: 'Failed to add person' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  try {
    await removePerson(Number(id));
    return NextResponse.json({ success: true });
  } catch (err) {
    log.error('Failed to remove person', err);
    return NextResponse.json({ error: 'Failed to remove person' }, { status: 500 });
  }
}
