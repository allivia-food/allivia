import { saveAvatar } from '@/services/avatar';
const mockUpload = jest.fn();
const mockRemove = jest.fn();
const mockUpdate = jest.fn();
jest.mock('@/services/supabase', () => ({
  getSupabase: () => ({ storage: { from: () => ({ upload: mockUpload, remove: mockRemove }) } }),
}));
jest.mock('@/services/profile', () => ({
  updateAvatar: (...args: unknown[]) => mockUpdate(...args),
}));
const originalFetch = global.fetch;
beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest
    .fn()
    .mockResolvedValue({ arrayBuffer: async () => new Uint8Array([255, 216]).buffer });
  mockUpload.mockResolvedValue({ error: null });
  mockRemove.mockResolvedValue({ error: null });
});
afterAll(() => {
  global.fetch = originalFetch;
});
it('updates the reference before removing the old photo', async () => {
  mockUpdate.mockResolvedValue({ id: 'u1', avatarPath: 'new' });
  await expect(saveAvatar('u1', 'file://photo', 'u1/old')).resolves.toEqual({
    id: 'u1',
    avatarPath: 'new',
  });
  expect(mockUpload).toHaveBeenCalledWith(expect.stringMatching(/^u1\//), expect.any(ArrayBuffer), {
    contentType: 'image/jpeg',
  });
  expect(mockRemove).toHaveBeenCalledWith(['u1/old']);
  expect(mockUpdate.mock.invocationCallOrder[0]).toBeLessThan(
    mockRemove.mock.invocationCallOrder[0],
  );
});
it('removes the abandoned upload when saving the reference fails', async () => {
  mockUpdate.mockRejectedValue(new Error('database'));
  await expect(saveAvatar('u1', 'file://photo', 'u1/old')).rejects.toThrow('database');
  expect(mockRemove).toHaveBeenCalledWith([mockUpload.mock.calls[0][0]]);
  expect(mockRemove).not.toHaveBeenCalledWith(['u1/old']);
});
it('keeps the committed photo if old-image cleanup fails', async () => {
  mockUpdate.mockResolvedValue({ id: 'u1' });
  mockRemove.mockRejectedValue(new Error('offline'));
  await expect(saveAvatar('u1', 'file://photo', 'u1/old')).resolves.toEqual({ id: 'u1' });
  expect(mockRemove).toHaveBeenCalledTimes(1);
});
it('does not update the profile if upload fails', async () => {
  mockUpload.mockResolvedValue({ error: new Error('upload') });
  await expect(saveAvatar('u1', 'file://photo')).rejects.toThrow('upload');
  expect(mockUpdate).not.toHaveBeenCalled();
});
